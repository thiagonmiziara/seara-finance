import { useEffect, useState } from 'react';
import { useHealthScore } from '@/hooks/useHealthScore';

export function ScoreWidget() {
  const { score, loading } = useHealthScore();
  const [animatedValue, setAnimatedValue] = useState(0);

  const total = score?.total ?? 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  const color = total < 40
    ? 'hsl(0, 72%, 50%)'
    : total < 70
      ? 'hsl(45, 90%, 55%)'
      : 'hsl(145, 65%, 45%)';

  useEffect(() => {
    if (!loading && score) {
      const timer = setTimeout(() => setAnimatedValue(score.total), 100);
      return () => clearTimeout(timer);
    }
  }, [loading, score]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/50">
        <div className="w-[120px] h-[120px] animate-pulse rounded-full bg-muted" />
        <span className="text-xs text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/50">
        <div className="w-[120px] h-[120px] flex items-center justify-center rounded-full border-4 border-muted">
          <span className="text-2xl font-bold text-muted-foreground">—</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Saúde Financeira — Pague faturas para ativar
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/50
                 hover:shadow-md transition-shadow duration-200 cursor-pointer"
      role="region"
      aria-label={`Sua saúde financeira: ${total} de 100 pontos.`}
    >
      <div className="relative flex items-center justify-center">
        <svg width="120" height="120" className="transform -rotate-90">
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span
          className="absolute text-4xl font-extrabold text-foreground"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {animatedValue}
        </span>
      </div>
      <span className="text-xs text-muted-foreground">Saúde Financeira</span>

      {/* Breakdown pills */}
      {score.breakdown && (
        <div className="flex flex-wrap gap-1.5 mt-1 justify-center">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            Limite: +{score.breakdown.limitUsage}pts
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            Pontualidade: +{score.breakdown.punctuality}pts
          </span>
        </div>
      )}
    </div>
  );
}
