import { useState } from 'react';
import { CreditCard as CreditCardType } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';
import { CardBrandIcon } from './CardBrandIcon';
import {
  detectCardBrand,
  formatCardNumber,
  maxCardDigits,
} from '@/lib/cardBrand';
import type { CardBrand } from '@/types';

interface EditCardLimitModalProps {
  card: CreditCardType;
  onUpdateLimit: (data: {
    id: string;
    data: { limit: number; limit_user_defined?: number; brand?: CardBrand; lastFour?: string };
  }) => Promise<any>;
  isUpdating?: boolean;
}

export function EditCardLimitModal({
  card,
  onUpdateLimit,
  isUpdating,
}: EditCardLimitModalProps) {
  const [open, setOpen] = useState(false);
  const [amountDisplay, setAmountDisplay] = useState('');
  const [plannedAmountDisplay, setPlannedAmountDisplay] = useState('');
  const [limitValue, setLimitValue] = useState(card.limit);
  const [limitPlannedValue, setLimitPlannedValue] = useState<number | undefined>(card.limit_user_defined);
  // Card number: display value typed by user (empty = unchanged)
  const [cardNumberDisplay, setCardNumberDisplay] = useState('');
  const [detectedBrand, setDetectedBrand] = useState<CardBrand | undefined>(
    card.brand as CardBrand | undefined,
  );
  const [detectedLastFour, setDetectedLastFour] = useState<string | undefined>(
    card.lastFour,
  );

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setAmountDisplay(
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(card.limit),
      );
      if (card.limit_user_defined) {
        setPlannedAmountDisplay(
          new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(card.limit_user_defined),
        );
      } else {
        setPlannedAmountDisplay('');
      }
      setLimitValue(card.limit);
      setLimitPlannedValue(card.limit_user_defined);
      setCardNumberDisplay('');
      setDetectedBrand(card.brand as CardBrand | undefined);
      setDetectedLastFour(card.lastFour);
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const brand = detectCardBrand(raw);
    const max = maxCardDigits(brand);
    const capped = raw.slice(0, max);
    setCardNumberDisplay(formatCardNumber(capped));
    setDetectedBrand(brand);
    setDetectedLastFour(capped.length >= 4 ? capped.slice(-4) : undefined);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setAmountDisplay('');
      setLimitValue(0);
      return;
    }

    const numberValue = parseInt(value, 10) / 100;
    setLimitValue(numberValue);

    setAmountDisplay(
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(numberValue),
    );
  };

  const handlePlannedAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setPlannedAmountDisplay('');
      setLimitPlannedValue(undefined);
      return;
    }

    const numberValue = parseInt(value, 10) / 100;
    setLimitPlannedValue(numberValue);

    setPlannedAmountDisplay(
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(numberValue),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (limitValue <= 0) return;
    try {
      await onUpdateLimit({
        id: card.id,
        data: {
          limit: limitValue,
          limit_user_defined: limitPlannedValue,
          brand: detectedBrand,
          lastFour: detectedLastFour,
        },
      });
      setOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className='h-6 w-6 p-0 text-muted-foreground hover:text-foreground'
          title='Editar cartão'
        >
          <Pencil className='h-3.5 w-3.5' />
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[400px]'>
        <DialogHeader>
          <DialogTitle>Editar Cartão</DialogTitle>
          <DialogDescription>
            Edite as informações do cartão <strong>{card.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Limit */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='newLimit' className='truncate block'>Limite do Banco</Label>
              <Input
                id='newLimit'
                value={amountDisplay}
                onChange={handleAmountChange}
                placeholder='R$ 0,00'
                autoFocus
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='limit_user_defined' className='truncate block'>
                Limite Planejado
              </Label>
              <Input
                id='limit_user_defined'
                value={plannedAmountDisplay}
                onChange={handlePlannedAmountChange}
                placeholder='R$ 0,00 (Opcional)'
              />
            </div>
          </div>

          {/* Divider */}
          <div className='flex items-center gap-2'>
            <div className='h-px flex-1 bg-border/60' />
            <span className='text-xs text-muted-foreground whitespace-nowrap'>
              Informações do cartão (opcional)
            </span>
            <div className='h-px flex-1 bg-border/60' />
          </div>

          {/* Card Number */}
          <div className='space-y-2'>
            <Label htmlFor='editCardNumber'>Número do Cartão</Label>
            <div className='relative flex items-center'>
              <Input
                id='editCardNumber'
                inputMode='numeric'
                placeholder={
                  card.lastFour
                    ? `•••• •••• •••• ${card.lastFour}`
                    : '0000 0000 0000 0000'
                }
                value={cardNumberDisplay}
                onChange={handleCardNumberChange}
                className='pr-14 font-mono tracking-widest'
              />
              <span className='absolute right-3 flex items-center'>
                <CardBrandIcon
                  brand={detectedBrand}
                  className='h-6 w-auto'
                  lucideSize={18}
                />
              </span>
            </div>
            <p className='text-xs text-muted-foreground'>
              Apenas a bandeira e os últimos 4 dígitos serão salvos.
            </p>
          </div>

          <div className='flex justify-end space-x-2 pt-4 border-t border-border/50'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type='submit'
              disabled={isUpdating || limitValue <= 0}
              className='min-w-[100px]'
            >
              {isUpdating ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
