import { useState, useMemo } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import { useLockedMeals } from '@/hooks/useLockedMeals';
import { RecipeCard } from './RecipeCard';
import { RecipeDetail } from './RecipeDetail';
import { WeekCalendar } from './WeekCalendar';
import type { Recipe, LockedMeal } from '@/lib/types';
import { Search } from 'lucide-react';

export function MumView() {
  const { data: recipes, isLoading } = useRecipes();
  const { data: lockedMeals } = useLockedMeals();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [preselectedDay, setPreselectedDay] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    if (!recipes) return [];
    if (!searchQuery.trim()) return recipes;
    const q = searchQuery.toLowerCase();
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.book_source?.toLowerCase().includes(q) ||
        r.ingredients?.toLowerCase().includes(q)
    );
  }, [recipes, searchQuery]);

  const handleSlotClick = (day: string) => {
    setPreselectedDay(day);
  };

  const handleLockedClick = (meal: LockedMeal) => {
    if (meal.recipes) {
      setSelectedRecipe(meal.recipes);
    }
  };

  return (
    <div className="space-y-5">
      {/* Week Planner - always visible */}
      <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
        <div className="px-4 py-3">
          <h2 className="font-serif text-lg text-foreground">This Week</h2>
        </div>
        <div className="px-4 pb-4 border-t border-border/30">
          <div className="pt-3">
            <WeekCalendar
              lockedMeals={lockedMeals || []}
              onSlotClick={handleSlotClick}
              onLockedClick={handleLockedClick}
            />
          </div>
        </div>
      </div>

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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search recipes, ingredients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
        />
      </div>

      {/* Recipes */}
      <h3 className="font-serif text-base text-foreground">
        {searchQuery.trim() ? `Results for "${searchQuery}"` : 'All Recipes'}
      </h3>
      {isLoading ? (
        <p className="text-muted-foreground text-center py-12">Loading recipes...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No recipes match your search</p>
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
