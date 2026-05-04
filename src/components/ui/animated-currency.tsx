import { useEffect, useRef, useState } from 'react';

const defaultBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

interface AnimatedCurrencyProps {
  value: number;
  isLoading?: boolean;
  formatter?: (value: number) => string;
  /** Count-up duration in ms when loading completes or value changes. */
  duration?: number;
  /** Scramble interval in ms while loading. */
  scrambleInterval?: number;
  className?: string;
}

export function AnimatedCurrency({
  value,
  isLoading = false,
  formatter = defaultBRL,
  duration = 700,
  scrambleInterval = 60,
  className,
}: AnimatedCurrencyProps) {
  const [display, setDisplay] = useState<number>(isLoading ? 0 : value);
  const rafRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scramble while loading
  useEffect(() => {
    if (!isLoading) return;
    const tick = () => {
      // Mantém a "magnitude" parecida com um valor real comum
      // (centenas/milhares) pra não pular do nada pra valores absurdos.
      const magnitude = Math.pow(10, 2 + Math.floor(Math.random() * 3));
      setDisplay(Math.random() * magnitude);
    };
    tick();
    intervalRef.current = setInterval(tick, scrambleInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isLoading, scrambleInterval]);

  // Count-up to the real value when loading finishes or value changes
  useEffect(() => {
    if (isLoading) return;
    const start = display;
    const end = value;
    if (start === end) {
      setDisplay(end);
      return;
    }
    const startTime = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(start + (end - start) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // We intentionally don't depend on `display` — that would restart the
    // animation on every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isLoading, duration]);

  return <span className={className}>{formatter(display)}</span>;
}
