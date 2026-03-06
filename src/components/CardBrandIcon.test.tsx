import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CardBrandIcon } from './CardBrandIcon';

describe('CardBrandIcon', () => {
  it('deve renderizar o ícone padrão quando brand não é fornecido', () => {
    const { container } = render(<CardBrandIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('deve renderizar o ícone correto para cada brand conhecido', () => {
    const brands = [
      'visa',
      'mastercard',
      'elo',
      'amex',
      'hipercard',
      'diners',
      'discover',
    ];
    brands.forEach((brand) => {
      const { getByAltText, unmount } = render(<CardBrandIcon brand={brand} />);
      expect(
        getByAltText(
          /visa|mastercard|elo|american express|hipercard|diners club|discover/i,
        ),
      ).toBeInTheDocument();
      unmount();
    });
  });
});
