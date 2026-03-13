import { useMemo } from 'react';
import type { Recipe } from '@/lib/types';
import { RecipeCard } from './RecipeCard';
import { StatusBar } from './StatusBar';
import { ArrowLeft } from 'lucide-react';

interface BookBrowserProps {
  bookSource: string;
  recipes: Recipe[];
  onBack: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  preselectedDay?: string;
}

function parsePageNum(ref: string | null): number {
  if (!ref) return 9999;
  const match = ref.match(/\d+/);
  return match ? parseInt(match[0], 10) : 9999;
}

export function BookBrowser({ bookSource, recipes, onBack, onSelectRecipe }: BookBrowserProps) {
  const bookRecipes = useMemo(() => {
    return recipes
      .filter((r) => r.book_source === bookSource)
      .sort((a, b) => parsePageNum(a.page_reference) - parsePageNum(b.page_reference));
  }, [recipes, bookSource]);

  return (
    <div className="space-y-5">
      {/* Book header */}
      <div className="space-y-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all books
        </button>
        <div className="bg-card rounded-lg border border-border/50 p-5 space-y-1">
          <h2 className="font-serif text-2xl text-foreground leading-tight">{bookSource}</h2>
          <p className="text-sm text-muted-foreground">
            {bookRecipes.length} recipe{bookRecipes.length !== 1 ? 's' : ''} saved from this book
          </p>
        </div>
      </div>

      {/* Recipes listed in page order */}
      {bookRecipes.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="font-serif text-lg text-foreground">No recipes added yet</p>
          <p className="text-sm text-muted-foreground">
            Recipes from this book will appear here once they're imported
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookRecipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => onSelectRecipe(recipe)}
              className="w-full flex items-center gap-4 rounded-lg bg-card border border-border/50 p-3 text-left hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
            >
              {recipe.image_url && (
                <div className="w-16 h-16 rounded-md overflow-hidden shrink-0">
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-base font-semibold text-foreground truncate">
                    {recipe.title}
                  </h3>
                </div>
                {recipe.page_reference && (
                  <p className="text-xs text-muted-foreground">{recipe.page_reference}</p>
                )}
                <StatusBar status={recipe.status} className="w-12" />
              </div>
              {recipe.warnings && recipe.warnings.length > 0 && (
                <span className="text-xs text-primary shrink-0">⚠️</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
