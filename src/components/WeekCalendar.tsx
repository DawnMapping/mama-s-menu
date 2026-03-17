import { MEAL_SLOTS } from '@/lib/types';
import type { LockedMeal } from '@/lib/types';
import { Check, X } from 'lucide-react';
import { useUnlockMeal } from '@/hooks/useLockedMeals';
import { toast } from 'sonner';

interface WeekCalendarProps {
  lockedMeals: LockedMeal[];
  onSlotClick: (day: string) => void;
  onLockedClick: (meal: LockedMeal) => void;
}

export function WeekCalendar({ lockedMeals, onSlotClick, onLockedClick }: WeekCalendarProps) {
  const mealsByDay = new Map(lockedMeals.map((m) => [m.day, m]));
  const unlockMeal = useUnlockMeal();

  const handleRemove = async (e: React.MouseEvent, meal: LockedMeal) => {
    e.stopPropagation();
    await unlockMeal.mutateAsync(meal.id);
    toast.success(`Removed "${meal.recipes?.title}" from ${meal.day}`);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {MEAL_SLOTS.map((slot) => {
          const meal = mealsByDay.get(slot);
          return meal ? (
            <button
              key={slot}
              onClick={() => onLockedClick(meal)}
              className="group flex items-center gap-2 rounded-lg bg-card border border-primary/30 p-3 text-left hover:shadow-sm transition-shadow relative"
            >
              <Check className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{slot}</p>
                <p className="text-sm font-serif font-semibold text-foreground truncate">
                  {meal.recipes?.title}
                </p>
              </div>
              <span
                role="button"
                onClick={(e) => handleRemove(e, meal)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-destructive/10 transition-all"
                title="Remove"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
              </span>
            </button>
          ) : (
            <button
              key={slot}
              onClick={() => onSlotClick(slot)}
              className="flex items-center gap-2 rounded-lg border border-dashed border-border p-3 text-left hover:bg-secondary/50 transition-colors"
            >
              <span className="text-lg text-muted-foreground">➕</span>
              <p className="text-xs text-muted-foreground">{slot}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
