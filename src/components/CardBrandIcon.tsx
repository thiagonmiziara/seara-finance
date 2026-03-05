import { CreditCard } from 'lucide-react';
import type { CardBrand } from '@/types';

import visaSvg from '@/assets/card-brands/visa.svg?url';
import mastercardSvg from '@/assets/card-brands/mastercard.svg?url';
import eloSvg from '@/assets/card-brands/elo.svg?url';
import amexSvg from '@/assets/card-brands/amex.svg?url';
import hipercardSvg from '@/assets/card-brands/hipercard.svg?url';
import dinersSvg from '@/assets/card-brands/diners.svg?url';
import discoverSvg from '@/assets/card-brands/discover.svg?url';

const brandSvgMap: Record<CardBrand, string> = {
  visa: visaSvg,
  mastercard: mastercardSvg,
  elo: eloSvg,
  amex: amexSvg,
  hipercard: hipercardSvg,
  diners: dinersSvg,
  discover: discoverSvg,
};

export const brandLabels: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  elo: 'Elo',
  amex: 'American Express',
  hipercard: 'Hipercard',
  diners: 'Diners Club',
  discover: 'Discover',
};

interface CardBrandIconProps {
  brand?: CardBrand | string;
  className?: string;
  /** Size in pixels for the fallback Lucide icon (default: 16) */
  lucideSize?: number;
}

export function CardBrandIcon({
  brand,
  className = 'h-7 w-auto',
  lucideSize = 16,
}: CardBrandIconProps) {
  if (!brand || !(brand in brandSvgMap)) {
    return <CreditCard size={lucideSize} className='text-muted-foreground' />;
  }

  const src = brandSvgMap[brand as CardBrand];
  const label = brandLabels[brand as CardBrand];

  return <img src={src} alt={label} className={className} draggable={false} />;
}
