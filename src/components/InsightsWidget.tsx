import { useEffect, useState, useMemo } from 'react';
import { useHealthScore } from '@/hooks/useHealthScore';
import { useSmartCreditScore, getStatusColor } from '@/hooks/useSmartCreditScore';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { useCards } from '@/hooks/useCards';
import { useFinance } from '@/hooks/useFinance';
import { useDebts } from '@/hooks/useDebts';

export function InsightsWidget() {
  const { score, loading } = useHealthScore();
  const { cards } = useCards();
  const { transactions } = useFinance();
  const { debts } = useDebts();

  const cardsUsageData = useMemo(() => {
    return cards.map((card) => {
      const cardTransactions = transactions.filter(
        (t) => t.cardId === card.id && t.status === 'a_pagar',
      );
      const cardDebts = debts
        .filter((d) => d.cardId === card.id && d.status !== 'pago')
        .filter((d) => d.installments - (d.paidInstallments || 0) > 0);
      const cardDebtRemaining = cardDebts.reduce((acc, d) => {
        const paidAmount = (d.paidInstallments || 0) * d.installmentAmount;
        return acc + (d.totalAmount - paidAmount);
      }, 0);
      const transactionUsed = cardTransactions.reduce(
        (acc, t) => acc + t.amount,
        0,
      );
      const usedLimit = cardDebts.length > 0 ? cardDebtRemaining : transactionUsed;
      return { card, usedLimit };
    });
  }, [cards, transactions, debts]);

  const smartScoreResult = useSmartCreditScore(cardsUsageData);
  const [animatedValue, setAnimatedValue] = useState(0);

  const total = score?.total ?? 0;
  const radius = 38;
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

  const globalColor = getStatusColor(smartScoreResult.globalStatus);
  const globalTextColor = globalColor.replace('bg-', 'text-');
  const globalBgColor = globalColor.replace('bg-', 'bg-').concat('/10');

  return (
    <div className="w-full relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      {/* Background flare */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-colors duration-1000 ${
        cards.length > 0 ? globalBgColor : 'bg-primary/10'
      }`} />

      <div className="p-5 sm:p-6 flex flex-col md:flex-row gap-6 md:gap-8 items-center justify-between relative z-10">
        
        {/* Left Side: Score */}
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className="relative flex items-center justify-center shrink-0">
            <svg width="88" height="88" className="transform -rotate-90">
              <circle cx="44" cy="44" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <circle
                cx="44" cy="44" r={radius}
                fill="none"
                stroke={color}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={loading || !score ? circumference : offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute text-2xl font-extrabold text-foreground" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              {loading ? '...' : !score ? '—' : animatedValue}
            </span>
          </div>

          <div className="flex flex-col">
            <h3 className="font-bold text-lg text-foreground leading-tight">Saúde Financeira</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {loading ? 'Analisando dados...' : !score ? 'Pague faturas para ativar' : 'Sua pontuação geral no momento'}
            </p>
            {score?.breakdown && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  Limite: +{score.breakdown.limitUsage}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  Pontualidade: +{score.breakdown.punctuality}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Divider for Desktop */}
        <div className="hidden md:block w-px h-16 bg-border/50" />
        {/* Divider for Mobile */}
        <div className="md:hidden w-full h-px bg-border/50" />

        {/* Right Side: Radar / Smart Score */}
        <div className="w-full md:w-auto flex-1 max-w-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`p-1.5 rounded-md transition-colors duration-1000 ${
              cards.length > 0 ? globalBgColor : 'bg-primary/10'
            } ${cards.length > 0 ? globalTextColor : 'text-primary'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-foreground font-semibold text-sm">Uso Real de Crédito</span>
          </div>

          {!cards.length ? (
            <p className="text-sm text-muted-foreground ml-8">
              Adicione um cartão para ver sua pontuação
            </p>
          ) : (
            <div className="ml-8">
              <div className="flex items-center gap-2 mb-2">
                {smartScoreResult.globalStatus === 'Risco' || smartScoreResult.globalStatus === 'Estourado' ? (
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${globalTextColor}`} />
                ) : null}
                <span className="text-sm text-muted-foreground leading-snug">
                  Seu portfólio está <strong className={`transition-colors duration-1000 ${globalTextColor}`}>{smartScoreResult.globalStatus}</strong>{' '}
                  com <strong className="text-foreground whitespace-nowrap">{smartScoreResult.globalScore.toFixed(1)}%</strong> da média de uso planejado.
                </span>
              </div>
              
              {/* Mini progress bar */}
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${globalColor}`}
                  style={{ width: `${Math.min(smartScoreResult.globalScore, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
