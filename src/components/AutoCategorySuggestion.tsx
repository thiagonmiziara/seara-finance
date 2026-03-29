import { useState } from 'react';
import { Bot, Check } from 'lucide-react';
import { useCategoryRules } from '@/hooks/useCategoryRules';
import { Button } from '@/components/ui/button';

interface AutoCategorySuggestionProps {
  pattern: string;
  category: string;
  onDismiss: () => void;
}

export function AutoCategorySuggestion({ pattern, category, onDismiss }: AutoCategorySuggestionProps) {
  const { createRule } = useCategoryRules();
  const [activated, setActivated] = useState(false);

  const handleActivate = async () => {
    await createRule(pattern, category);
    setActivated(true);
    setTimeout(onDismiss, 1500);
  };

  if (activated) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-card border-l-[3px]
                       border-emerald-500 rounded-r-lg transition-opacity duration-300">
        <Check className="w-4 h-4 text-emerald-500" />
        <span className="text-sm text-emerald-500">Regra criada com sucesso! ✓</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between px-4 py-3 bg-card
                 border-l-[3px] border-emerald-500 rounded-r-lg border border-border/50"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Bot className="w-4 h-4 text-emerald-500 shrink-0" />
        <span className="text-sm text-foreground truncate">
          Você categorizou &quot;{pattern}&quot; como {category} 3 vezes. Deseja criar uma regra automática?
        </span>
      </div>
      <div className="flex gap-2 shrink-0 ml-2">
        <Button
          size="sm"
          onClick={handleActivate}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
        >
          Ativar ✓
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDismiss}
          className="text-xs"
        >
          Não, obrigado
        </Button>
      </div>
    </div>
  );
}
