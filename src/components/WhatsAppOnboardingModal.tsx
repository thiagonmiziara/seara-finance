import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { MessageSquareShare } from 'lucide-react';

export function WhatsAppOnboardingModal() {
  const { user } = useAuth();
  const { profile, updateProfile, loading } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && profile && !profile.whatsappNumber) {
      setIsOpen(true);
    }
  }, [loading, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !user) return;

    setIsSubmitting(true);
    try {
      // 1. Limpa o número (remove espaços, traços, etc)
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      // 2. Salva no Firestore
      await updateProfile({ whatsappNumber: formattedPhone });

      // 3. Chama o Bot para enviar as instruções
      const botUrl = import.meta.env.VITE_BOT_URL || 'http://localhost:3002';
      await fetch(`${botUrl}/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          name: user.name,
          uid: user.id, // Envia o UID do Firebase
        }),
      });

      setIsOpen(false);
    } catch (err) {
      console.error('Erro ao salvar onboarding:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
            <MessageSquareShare className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <DialogTitle className="text-center">Conecte o seu WhatsApp</DialogTitle>
          <DialogDescription className="text-center">
            Registre suas transações enviando mensagens simples! Informe seu número com DDD para receber as instruções.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Número do WhatsApp (com DDD)</Label>
            <Input
              id="phone"
              placeholder="Ex: 34984211909"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <p className="text-[10px] text-muted-foreground">
              Não se preocupe, seus dados estão seguros conforme nossa política de privacidade.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando instruções...' : 'Receber instruções no WhatsApp'}
            </Button>
            <Button 
                type="button" 
                variant="ghost" 
                className="w-full text-xs text-muted-foreground" 
                onClick={() => setIsOpen(false)}
            >
                Configurar depois
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
