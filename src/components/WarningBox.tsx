import { cn } from '@/lib/utils';

interface WarningBoxProps {
  warnings: string[];
  animate?: boolean;
  className?: string;
}

export function WarningBox({ warnings, animate = false, className }: WarningBoxProps) {
  if (!warnings.length) return null;

  return (
    <div
      className={cn(
        'rounded-lg bg-rose-soft px-4 py-3 border border-primary/20',
        animate && 'animate-gentle-pulse',
        className
      )}
    >
      {warnings.map((w, i) => (
        <p key={i} className="text-sm text-foreground/80">
          ⚠️ {w}
        </p>
      ))}
    </div>
  );
}
