import type { Recipe } from '@/lib/types';
import { StatusBar } from './StatusBar';
import recipeSalmon from '@/assets/recipe-salmon.jpg';
import recipeStirfry from '@/assets/recipe-stirfry.jpg';
import recipeSoup from '@/assets/recipe-soup.jpg';
import recipeSalad from '@/assets/recipe-salad.jpg';

const fallbackImages: Record<string, string> = {
  '/recipe-salmon.jpg': recipeSalmon,
  '/recipe-stirfry.jpg': recipeStirfry,
  '/recipe-soup.jpg': recipeSoup,
  '/recipe-salad.jpg': recipeSalad,
};

function getImageSrc(url: string | null) {
  if (!url) return recipeSalmon;
  return fallbackImages[url] || url;
}

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
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={getImageSrc(recipe.image_url)}
          alt={recipe.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-4 space-y-2">
        <StatusBar status={recipe.status} />
        <h3 className="font-serif text-lg font-semibold leading-tight text-foreground">
          {recipe.title}
        </h3>
        {recipe.book_source && (
          <p className="text-xs text-muted-foreground truncate">
            {recipe.book_source}
          </p>
        )}
      </div>
    </button>
  );
}
