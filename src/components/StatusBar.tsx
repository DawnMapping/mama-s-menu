import { cn } from '@/lib/utils';

interface StatusBarProps {
  status: string;
  className?: string;
}

export function StatusBar({ status, className }: StatusBarProps) {
  return (
    <div
      className={cn(
        'h-1 w-full rounded-full',
        status === 'green' && 'bg-status-green',
        status === 'yellow' && 'bg-status-yellow',
        status === 'red' && 'bg-status-red',
        className
      )}
    />
  );
}
