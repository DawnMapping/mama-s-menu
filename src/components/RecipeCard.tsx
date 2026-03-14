import type { Recipe } from '@/lib/types';
import { StatusBar } from './StatusBar';
import { UtensilsCrossed } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-lg bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-border/50"
    >
      {recipe.image_url ? (
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-secondary/50 flex items-center justify-center">
          <UtensilsCrossed className="w-10 h-10 text-muted-foreground/30" />
        </div>
      )}
      <div className="p-4 space-y-2">
        <StatusBar status={recipe.status} />
        <h3 className="font-serif text-lg font-semibold leading-tight text-foreground">
          {recipe.title}
        </h3>
        {(recipe.book_source || recipe.page_reference) && (
          <p className="text-xs text-muted-foreground truncate">
            {[recipe.book_source, recipe.page_reference].filter(Boolean).join(', ')}
          </p>
        )}
      </div>
    </button>
  );
}
