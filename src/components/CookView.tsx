import { useLockedMeals, useUnlockMeal } from '@/hooks/useLockedMeals';
import { WarningBox } from './WarningBox';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export function CookView() {
  const { data: meals, isLoading } = useLockedMeals();
  const unlockMeal = useUnlockMeal();

  if (isLoading) {
    return <p className="text-muted-foreground text-center py-12">Loading...</p>;
  }

  if (!meals?.length) {
    return (
      <div className="text-center py-16 space-y-2">
        <p className="font-serif text-xl text-foreground">No meals locked yet</p>
        <p className="text-sm text-muted-foreground">Switch to Mum's View to start planning</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="font-serif text-xl text-foreground">This Week's Cooking Plan</h2>
      <div className="space-y-3">
        {meals.map((meal) => (
          <div
            key={meal.id}
            className="rounded-lg bg-card border border-border/50 p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold text-gold uppercase tracking-wide">
                  {meal.day}
                </p>
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  {meal.recipes?.title}
                </h3>
                {meal.recipes?.book_source && (
                  <p className="text-xs text-muted-foreground italic">
                    {meal.recipes.book_source}
                    {meal.recipes.page_reference && `, ${meal.recipes.page_reference}`}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await unlockMeal.mutateAsync(meal.id);
                  toast.success('Meal unlocked');
                }}
              >
                <Unlock className="w-4 h-4" />
              </Button>
            </div>
            {meal.warnings_at_lock && meal.warnings_at_lock.length > 0 && (
              <WarningBox warnings={meal.warnings_at_lock} />
            )}
            {meal.notes && (
              <p className="text-sm text-foreground/70 italic">Note: {meal.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
