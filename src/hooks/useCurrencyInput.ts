import { useCallback, useState } from 'react';

/**
 * Parse a BR-formatted currency string ("150,50") to a number.
 * Returns 0 for empty/invalid input.
 */
export function parseCurrency(display: string): number {
  const numeric = parseFloat(display.replace(',', '.'));
  return isNaN(numeric) ? 0 : numeric;
}

/**
 * Manages the display state for a BR currency input: allows only digits and a
 * single comma, and syncs the parsed numeric value back to a form field.
 *
 * @param initial initial display string (e.g. when editing an existing record)
 */
export function useCurrencyInput(initial = '') {
  const [display, setDisplay] = useState(initial);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      onChange: (value: number) => void,
    ) => {
      // Allow only digits and one comma
      const raw = e.target.value.replace(/[^0-9,]/g, '');
      const parts = raw.split(',');
      const sanitized =
        parts.length > 2 ? parts[0] + ',' + parts.slice(1).join('') : raw;
      setDisplay(sanitized);
      onChange(parseCurrency(sanitized));
    },
    [],
  );

  const reset = useCallback(() => setDisplay(''), []);

  return { display, setDisplay, handleChange, reset };
}
