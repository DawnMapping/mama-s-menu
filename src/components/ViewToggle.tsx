import type { ViewMode } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-secondary p-1">
      <button
        onClick={() => onChange('mum')}
        className={cn(
          'px-4 py-1.5 text-sm rounded-md transition-all duration-200 font-serif',
          mode === 'mum'
            ? 'bg-card shadow-sm text-foreground font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Mum's View
      </button>
      <button
        onClick={() => onChange('cook')}
        className={cn(
          'px-4 py-1.5 text-sm rounded-md transition-all duration-200 font-serif',
          mode === 'cook'
            ? 'bg-card shadow-sm text-foreground font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Cook's View
      </button>
    </div>
  );
}
