import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
}

function initialsFrom(name?: string | null): string {
  if (!name) return 'U';
  return (
    name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U'
  );
}

/**
 * Avatar com fallback automático: tenta carregar `src`, e ao falhar
 * (URL quebrada, expirada, sem rede) cai pras iniciais do nome num
 * círculo colorido. Reseta o estado de erro quando o `src` muda.
 */
export function UserAvatar({ src, name, className }: UserAvatarProps) {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  const showImage = src && !errored;

  if (showImage) {
    return (
      <img
        src={src}
        alt={name ?? 'Avatar'}
        onError={() => setErrored(true)}
        className={cn(
          'h-9 w-9 rounded-full object-cover ring-2 ring-border',
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm select-none',
        className,
      )}
      aria-label={name ?? 'Avatar'}
    >
      {initialsFrom(name)}
    </div>
  );
}
