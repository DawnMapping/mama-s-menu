import { MEAL_SLOTS } from '@/lib/types';
import type { LockedMeal } from '@/lib/types';
import { Lock } from 'lucide-react';

interface WeekCalendarProps {
  lockedMeals: LockedMeal[];
  onSlotClick: (day: string) => void;
  onLockedClick: (meal: LockedMeal) => void;
}

export function WeekCalendar({ lockedMeals, onSlotClick, onLockedClick }: WeekCalendarProps) {
  const mealsByDay = new Map(lockedMeals.map((m) => [m.day, m]));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {MEAL_SLOTS.map((slot) => {
          const meal = mealsByDay.get(slot);
          return meal ? (
            <button
              key={slot}
              onClick={() => onLockedClick(meal)}
              className="flex items-center gap-2 rounded-lg bg-card border border-border/50 p-3 text-left hover:shadow-sm transition-shadow"
            >
              <Lock className="w-4 h-4 text-gold shrink-0 animate-lock" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{slot}</p>
                <p className="text-sm font-serif font-semibold text-foreground truncate">
                  {meal.recipes?.title}
                </p>
              </div>
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
