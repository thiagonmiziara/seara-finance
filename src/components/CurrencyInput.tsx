interface CurrencyInputProps {
  /** Display value (BR-formatted string with comma) */
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Input id, used to associate an external <Label htmlFor> */
  id?: string;
  placeholder?: string;
}

/**
 * Currency field with a fixed "R$" prefix. Presentational only — the display
 * string and its parsing are owned by the caller (see useCurrencyInput).
 */
export function CurrencyInput({
  value,
  onChange,
  id,
  placeholder = '0,00',
}: CurrencyInputProps) {
  return (
    <div className='flex items-center border border-input rounded-md focus-within:ring-2 focus-within:ring-ring bg-background overflow-hidden'>
      <span className='px-3 text-sm text-muted-foreground select-none border-r border-input h-full flex items-center'>
        R$
      </span>
      <input
        id={id}
        type='text'
        inputMode='decimal'
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className='flex-1 px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground'
      />
    </div>
  );
}
