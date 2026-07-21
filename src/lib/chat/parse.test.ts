import { describe, expect, it } from 'vitest';
import { autoDetectCategory, parseAmount, parseNaturalTransaction } from './parse';

const CATEGORIES = [
  { value: 'salario', label: 'Salário' },
  { value: 'compras', label: 'Compras' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'lazer', label: 'Lazer' },
  { value: 'outros', label: 'Outros' },
];

describe('parseAmount', () => {
  it('aceita formato BR com milhar', () => {
    expect(parseAmount('1.500,00')).toBe(1500);
  });
  it('aceita vírgula simples', () => {
    expect(parseAmount('45,90')).toBe(45.9);
  });
  it('aceita número simples', () => {
    expect(parseAmount('50')).toBe(50);
  });
  it('retorna null para texto sem número', () => {
    expect(parseAmount('abc')).toBeNull();
  });
});

describe('autoDetectCategory', () => {
  it('detecta pela palavra-chave dentro das categorias disponíveis', () => {
    expect(autoDetectCategory('Mercado da esquina', CATEGORIES)?.value).toBe('compras');
    expect(autoDetectCategory('Uber pro trabalho', CATEGORIES)?.value).toBe('transporte');
  });

  it('ignora categoria não cadastrada pelo usuário e cai em outros', () => {
    // "saude"/"farmácia" existe nas keywords do bot mas não na lista do usuário
    expect(autoDetectCategory('Farmácia São João', CATEGORIES)?.value).toBe('outros');
  });
});

describe('parseNaturalTransaction', () => {
  it('interpreta "paguei 50 no mercado" como despesa categorizada', () => {
    const result = parseNaturalTransaction('paguei 50 no mercado', CATEGORIES);
    expect(result).toMatchObject({
      type: 'expense',
      amount: 50,
      description: 'Mercado',
      category: { value: 'compras' },
    });
  });

  it('interpreta "recebi 2500 de salário" como receita', () => {
    const result = parseNaturalTransaction('recebi 2500 de salário', CATEGORIES);
    expect(result?.type).toBe('income');
    expect(result?.amount).toBe(2500);
  });

  it('retorna null sem verbo reconhecido', () => {
    expect(parseNaturalTransaction('almoço 35', CATEGORIES)).toBeNull();
  });

  it('retorna null sem valor', () => {
    expect(parseNaturalTransaction('paguei no mercado', CATEGORIES)).toBeNull();
  });
});
