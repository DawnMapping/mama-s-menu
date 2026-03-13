import { useState, useMemo } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import { useLockedMeals } from '@/hooks/useLockedMeals';
import { RecipeCard } from './RecipeCard';
import { RecipeDetail } from './RecipeDetail';
import { WeekCalendar } from './WeekCalendar';
import { BOOK_SOURCES } from '@/lib/types';
import type { Recipe, LockedMeal } from '@/lib/types';
import { cn } from '@/lib/utils';

export function MumView() {
  const { data: recipes, isLoading } = useRecipes();
  const { data: lockedMeals } = useLockedMeals();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [preselectedDay, setPreselectedDay] = useState<string | undefined>();
  const [lockedMealDetail, setLockedMealDetail] = useState<LockedMeal | null>(null);

  const filtered = useMemo(() => {
    if (!recipes) return [];
    if (activeFilter === 'All') return recipes;
    return recipes.filter((r) => r.book_source === activeFilter);
  }, [recipes, activeFilter]);

  const handleSlotClick = (day: string) => {
    setPreselectedDay(day);
    // Scroll to recipe grid
  };

  const handleLockedClick = (meal: LockedMeal) => {
    if (meal.recipes) {
      setSelectedRecipe(meal.recipes);
    }
  };

  return (
    <div className="space-y-8">
      <WeekCalendar
        lockedMeals={lockedMeals || []}
        onSlotClick={handleSlotClick}
        onLockedClick={handleLockedClick}
      />

      {preselectedDay && (
        <div className="bg-rose-soft rounded-lg px-4 py-2 flex items-center justify-between">
          <p className="text-sm text-foreground">
            Choosing recipe for <span className="font-semibold">{preselectedDay}</span>
          </p>
          <button
            onClick={() => setPreselectedDay(undefined)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {BOOK_SOURCES.map((source) => (
          <button
            key={source}
            onClick={() => setActiveFilter(source)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-full border transition-all duration-200',
              activeFilter === source
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/50'
            )}
          >
            {source}
          </button>
        ))}
      </div>

      {/* Recipe Grid */}
      {isLoading ? (
        <p className="text-muted-foreground text-center py-12">Loading recipes...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => setSelectedRecipe(recipe)}
            />
          ))}
        </div>
      )}

      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          open={!!selectedRecipe}
          onClose={() => {
            setSelectedRecipe(null);
            setPreselectedDay(undefined);
          }}
          preselectedDay={preselectedDay}
        />
      )}
    </div>
  );
}
