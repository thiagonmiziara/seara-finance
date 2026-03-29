import { TrendingUp, AlertTriangle } from 'lucide-react';
import { useInstallmentProjection } from '@/hooks/useInstallmentProjection';

interface RadarCardProps {
  cardId: string;
}

export function RadarCard({ cardId }: RadarCardProps) {
  const { criticalMonth } = useInstallmentProjection(cardId);

  return (
    <div
      className="w-full p-4 rounded-xl bg-card border border-border/50 hover:shadow-md
                 transition-shadow duration-200 text-left cursor-pointer"
      role="region"
      aria-label={
        criticalMonth && criticalMonth.limitUsedPercent > 0
          ? `Radar de Parcelas: mês mais apertado é ${criticalMonth.label} com ${criticalMonth.limitUsedPercent} por cento do limite`
          : 'Radar de Parcelas: sem parcelas futuras, limite livre'
      }
    >
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        <span className="text-foreground font-semibold text-base">Radar de Parcelas</span>
      </div>
      {criticalMonth && criticalMonth.limitUsedPercent > 0 ? (
        <div className="flex items-center gap-2">
          {criticalMonth.limitUsedPercent >= 85 && (
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          )}
          <span className="text-sm text-muted-foreground">
            Mês mais apertado: {criticalMonth.label} — {criticalMonth.limitUsedPercent}% do limite
          </span>
        </div>
      ) : (
        <span className="text-sm text-emerald-500">
          Sem parcelas futuras — limite livre! 🎉
        </span>
      )}
    </div>
  );
}
