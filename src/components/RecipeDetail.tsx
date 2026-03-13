import { useState } from 'react';
import type { Recipe } from '@/lib/types';
import { MEAL_SLOTS } from '@/lib/types';
import { WarningBox } from './WarningBox';
import { StatusBar } from './StatusBar';
import { useLockMeal } from '@/hooks/useLockedMeals';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UtensilsCrossed } from 'lucide-react';

interface RecipeDetailProps {
  recipe: Recipe;
  open: boolean;
  onClose: () => void;
  preselectedDay?: string;
}

/** Split newline-separated text into list items */
function TextList({ text, ordered }: { text: string; ordered?: boolean }) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1) {
    return <p className="text-sm text-foreground/80 leading-relaxed">{text}</p>;
  }

  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className={`text-sm text-foreground/80 leading-relaxed space-y-1 pl-5 ${ordered ? 'list-decimal' : 'list-disc'}`}>
      {lines.map((line, i) => (
        <li key={i}>{line.replace(/^\d+\.\s*/, '')}</li>
      ))}
    </Tag>
  );
}

export function RecipeDetail({ recipe, open, onClose, preselectedDay }: RecipeDetailProps) {
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const lockMeal = useLockMeal();
  const warnings = recipe.warnings?.filter(Boolean) || [];

  const handleLock = async (day: string) => {
    await lockMeal.mutateAsync({
      recipe_id: recipe.id,
      day,
      warnings_at_lock: warnings,
    });
    setShowSlotPicker(false);
    toast.success(`Locked "${recipe.title}" for ${day}`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-card border-border/50 max-h-[90vh] overflow-y-auto">
        {recipe.image_url ? (
          <div className="aspect-[16/10] overflow-hidden">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-24 bg-secondary/50 flex items-center justify-center">
            <UtensilsCrossed className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="p-6 space-y-4">
          {warnings.length > 0 && <WarningBox warnings={warnings} animate />}
          <StatusBar status={recipe.status} />
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-foreground">
              {recipe.title}
            </DialogTitle>
          </DialogHeader>
          {recipe.book_source && (
            <p className="text-sm text-muted-foreground italic font-serif-display">
              {recipe.book_source}
              {recipe.page_reference && `, ${recipe.page_reference}`}
            </p>
          )}
          {recipe.ingredients && (
            <div>
              <h4 className="font-serif text-base font-semibold text-foreground mb-2">Ingredients</h4>
              <TextList text={recipe.ingredients} />
            </div>
          )}
          {recipe.instructions && (
            <div>
              <h4 className="font-serif text-base font-semibold text-foreground mb-2">Method</h4>
              <TextList text={recipe.instructions} ordered />
            </div>
          )}

          {!showSlotPicker ? (
            <Button
              onClick={() => preselectedDay ? handleLock(preselectedDay) : setShowSlotPicker(true)}
              className="w-full"
              disabled={lockMeal.isPending}
            >
              {preselectedDay ? `Lock for ${preselectedDay}` : 'Lock for...'}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-serif text-foreground font-semibold">Choose a meal slot:</p>
              <div className="grid grid-cols-2 gap-2">
                {MEAL_SLOTS.map((slot) => (
                  <Button
                    key={slot}
                    variant="outline"
                    size="sm"
                    onClick={() => handleLock(slot)}
                    disabled={lockMeal.isPending}
                    className="text-xs"
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
