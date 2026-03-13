import { useState, useMemo } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import { useLockedMeals } from '@/hooks/useLockedMeals';
import { RecipeCard } from './RecipeCard';
import { RecipeDetail } from './RecipeDetail';
import { WeekCalendar } from './WeekCalendar';
import { BOOK_SOURCES } from '@/lib/types';
import type { Recipe, LockedMeal } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

export function MumView() {
  const { data: recipes, isLoading } = useRecipes();
  const { data: lockedMeals } = useLockedMeals();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [preselectedDay, setPreselectedDay] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const lockedCount = lockedMeals?.length || 0;

  const filtered = useMemo(() => {
    if (!recipes) return [];
    let result = recipes;
    if (activeFilter !== 'All') {
      result = result.filter((r) => r.book_source === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.book_source?.toLowerCase().includes(q) ||
          r.ingredients?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [recipes, activeFilter, searchQuery]);

  const handleSlotClick = (day: string) => {
    setPreselectedDay(day);
    setCalendarOpen(false);
  };

  const handleLockedClick = (meal: LockedMeal) => {
    if (meal.recipes) {
      setSelectedRecipe(meal.recipes);
    }
  };

  return (
    <div className="space-y-5">
      {/* Collapsible Week Planner */}
      <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
        <button
          onClick={() => setCalendarOpen(!calendarOpen)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg text-foreground">This Week</h2>
            {lockedCount > 0 && (
              <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                {lockedCount} meal{lockedCount !== 1 ? 's' : ''} planned
              </span>
            )}
          </div>
          {calendarOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        {calendarOpen && (
          <div className="px-4 pb-4 border-t border-border/30">
            <div className="pt-3">
              <WeekCalendar
                lockedMeals={lockedMeals || []}
                onSlotClick={handleSlotClick}
                onLockedClick={handleLockedClick}
              />
            </div>
          </div>
        )}
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
          placeholder="Search recipes, ingredients, books..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
        />
      </div>

      {/* Book Filter */}
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
            {source === 'All' ? 'All Books' : source.replace('The CSIRO ', '').replace('CSIRO ', '')}
          </button>
        ))}
      </div>

      {/* Recipe Grid */}
      {isLoading ? (
        <p className="text-muted-foreground text-center py-12">Loading recipes...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          {searchQuery ? 'No recipes match your search' : 'No recipes in this book yet'}
        </p>
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
