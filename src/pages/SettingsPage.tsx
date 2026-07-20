import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResetAccountDialog } from '@/components/ResetAccountDialog';
import { useResetAccount } from '@/hooks/useResetAccount';
import { useNavigation } from '@/components/layout/navigation';
import { showToast } from '@/lib/toast';

export default function SettingsPage() {
  const { resetAccount, isDeleting } = useResetAccount();
  const queryClient = useQueryClient();
  const { navigate } = useNavigation();
  const [open, setOpen] = useState(false);

  const handleReset = async () => {
    const total = await resetAccount();
    // Limpa os caches locais e volta pro início.
    await queryClient.invalidateQueries();
    showToast({
      message:
        total > 0
          ? `Conta zerada (${total} registros apagados).`
          : 'Sua conta já estava vazia.',
      type: 'success',
    });
    navigate('dashboard');
  };

  return (
    <div className='space-y-8 max-w-3xl'>
      <div>
        <h1 className='text-3xl font-extrabold tracking-tight font-display'>
          Configurações
        </h1>
        <p className='text-sm text-muted-foreground mt-1'>
          Gerencie sua conta e seus dados.
        </p>
      </div>

      <section className='rounded-2xl border border-red-500/40 bg-red-500/5 overflow-hidden'>
        <div className='px-5 py-4 border-b border-red-500/30 flex items-center gap-2'>
          <AlertTriangle className='h-5 w-5 text-red-600 dark:text-red-400' />
          <h2 className='font-bold text-red-700 dark:text-red-400'>
            Zona de perigo
          </h2>
        </div>

        <div className='p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div className='min-w-0'>
            <h3 className='font-semibold'>Zerar conta</h3>
            <p className='text-sm text-muted-foreground mt-1'>
              Apaga <strong>todos</strong> os registros das contas{' '}
              <strong>Pessoal</strong> e <strong>Empresarial</strong>{' '}
              (transações, cartões, dívidas, contas fixas, categorias e
              objetivos). Esta ação é <strong>irreversível</strong>.
            </p>
          </div>
          <Button
            type='button'
            onClick={() => setOpen(true)}
            disabled={isDeleting}
            className='shrink-0 bg-red-500 hover:bg-red-500/90 text-white'
          >
            <Trash2 className='mr-2 h-4 w-4' />
            Zerar conta
          </Button>
        </div>
      </section>

      <ResetAccountDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleReset}
        isDeleting={isDeleting}
      />
    </div>
  );
}
