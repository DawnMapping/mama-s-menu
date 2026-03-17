import type { Recipe } from '@/lib/types';
import { StatusBar } from './StatusBar';
import { UtensilsCrossed, Clock } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  const hasNutrition = recipe.calories != null;
  const totalTime =
    (recipe.prep_time_min || 0) + (recipe.cook_time_min || 0) || null;

  return (
    <button
      onClick={onClick}
      className="group text-left rounded-lg bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-border/50"
    >
      <div className="relative">
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

        {/* Nutrition overlay badges */}
        {hasNutrition && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full bg-background/85 backdrop-blur-sm px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-sm">
              🔥 {recipe.calories}
            </span>
            <span className="inline-flex items-center rounded-full bg-primary/90 backdrop-blur-sm px-2 py-0.5 text-[11px] font-bold text-primary-foreground shadow-sm">
              {recipe.protein_g}g protein
            </span>
            <span className="inline-flex items-center rounded-full bg-background/85 backdrop-blur-sm px-2 py-0.5 text-[11px] text-foreground/80 shadow-sm">
              C {recipe.carbs_g}g · F {recipe.fat_g}g
            </span>
            {totalTime && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-background/85 backdrop-blur-sm px-2 py-0.5 text-[11px] text-foreground/80 shadow-sm">
                <Clock className="w-3 h-3" />
                {totalTime}m
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <StatusBar status={recipe.status} />
        <h3 className="font-serif text-lg font-semibold leading-tight text-foreground capitalize">
          {recipe.title}
        </h3>
        {(recipe.book_source || recipe.page_reference) && (
          <p className="text-xs text-muted-foreground truncate">
            {[recipe.book_source?.split(',')[0], recipe.page_reference].filter(Boolean).join(', ')}
          </p>
        )}
      </div>
    </button>
  );
}
