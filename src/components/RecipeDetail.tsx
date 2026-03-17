import { useState } from 'react';
import type { Recipe } from '@/lib/types';
import { MEAL_SLOTS } from '@/lib/types';
import { WarningBox } from './WarningBox';
import { StatusBar } from './StatusBar';
import { useLockMeal } from '@/hooks/useLockedMeals';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UtensilsCrossed, Flame, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const COLBERT_GIFS = [
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3Zobzg2ZzhsN2V4bWY2OGo4ZXVmZXhnNzE2YXd4ZzMyM3FmemZzcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/147JO3pIxNJ4oo/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3Zobzg2ZzhsN2V4bWY2OGo4ZXVmZXhnNzE2YXd4ZzMyM3FmemZzcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/thUM5CWFPNoLS/giphy.gif',
  'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExY3BhbWRlNWhkOTIxaHV4bnJrOXB3a3AxdHdreTk4ZzBwNDZpY3RtOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MrdaOsKoKxjm8/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dnEyZmtncHFmc2gyYjc2bzJ5OGZ1dXRsd2J5MWdrOTlodTM4MThneCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/zfuOq2rFBE7Kg/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dnEyZmtncHFmc2gyYjc2bzJ5OGZ1dXRsd2J5MWdrOTlodTM4MThneCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/uaOqWaZpebl8k/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dnEyZmtncHFmc2gyYjc2bzJ5OGZ1dXRsd2J5MWdrOTlodTM4MThneCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/oUkLEfuYSrPOg/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dnEyZmtncHFmc2gyYjc2bzJ5OGZ1dXRsd2J5MWdrOTlodTM4MThneCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3FNCFXeaVSwEM/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dnEyZmtncHFmc2gyYjc2bzJ5OGZ1dXRsd2J5MWdrOTlodTM4MThneCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/zaqclXyLz3Uoo/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bmU2Nzdka2J0ZTR4OHk3ajMyNzFsczUwOXJhcmludDJ3c2gyNG05eCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/lvuKkjGQvT4hq/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bmU2Nzdka2J0ZTR4OHk3ajMyNzFsczUwOXJhcmludDJ3c2gyNG05eCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/V9ylxG8HD8cZW/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dnEyZmtncHFmc2gyYjc2bzJ5OGZ1dXRsd2J5MWdrOTlodTM4MThneCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/2CcKiHPDsJqVi/giphy.gif',
  'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExZmhlZnl3aGFidnpsbGEzOHB2amJjbHlwNWF4Mm1meTRocXk3YmY5OSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/DEQPn2GWwjYzUqABzl/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3YWhrNm0zN29lMHJxN25qcjh1dGpjbXEwcnptZzAwd3VtZWl6dDBsNSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mEDebuiUyLMrbIXAgA/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3b25pOWRndngwbWZuMjQ5djBqY2IzdWZ2bXBjM3Njajlramc5ZnRxdSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/128Z9uRSBDxpV6/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3b25pOWRndngwbWZuMjQ5djBqY2IzdWZ2bXBjM3Njajlramc5ZnRxdSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/26BRJacsGgySuobVC/giphy.gif',
  'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExMDkwZGtrbDJnaTl1bHZmdWF2ZzBoa3NneXg0Zm1mNWxuazNqem9wOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oGRFp0AqM0BY4axjO/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dnEyZmtncHFmc2gyYjc2bzJ5OGZ1dXRsd2J5MWdrOTlodTM4MThneCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/F2i6WDelFutZnUtJlX/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3cmNzbW9lOG91N2NpYXc4ZzQwZ3k1cThhYjB3MHh6dnFmN2gyOWZ1NCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/14idmpaz53MkAE/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dmN0NThzeTgwYWN5cjJlYWZuNTdoNGZqb20wZ29uMjFmajJic2lhaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/26ufpy0ZlwFqVIQJq/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dmN0NThzeTgwYWN5cjJlYWZuNTdoNGZqb20wZ29uMjFmajJic2lhaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/WUq1cg9K7uzHa/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bDFoOWdoZmVnbjI5dDZsOXh6dTNxaGZicGMybHFiMzBnYmxzdWdzbSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/FC4dBq6KGuQnK/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bDFoOWdoZmVnbjI5dDZsOXh6dTNxaGZicGMybHFiMzBnYmxzdWdzbSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xT9IgC5oWqb6F3lvtm/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OGJlb25qdmhsbjYycmpjb3JncWRud3k0amNweWd3ZGlwczA5ZGZycyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l4FGCfK4sKA7kphh6/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3c3ZvaHg4Z2xpZGlzaDl2NzV6bTBzdTdkNXFib3R4bzdhdTJ1cW01cyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/zI2xxBtbAig6Y/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3M2xqejR4YXZoNmloYWR2eGJpY2M4Z3Z3YnYxamV4aTk4Zm9mNHJzaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o7TKMGGGmY4n1L9tu/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dzRhdXViMzBrMnU4M3Q5NnEwNHhqaXNlbjJ6eHN4OWZhZTBscndvcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ZXwT8GWPQ9eARJa8hJ/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3aWFhemxvNTZoODF6eG13dHkzOWZpN3J0eDBqdm44bmI2YTdtN2xxYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/FNI0tMfNdCYqT5ooKn/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3aWFhemxvNTZoODF6eG13dHkzOWZpN3J0eDBqdm44bmI2YTdtN2xxYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5gMOxUZoYc0BPLR8rx/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3NGc4cTA2cDZiOG9wdHV5OHR2YTI5YmhlYzVkZzQxMDltYmxiZ2llZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/tC2vZzw1ZcW2PphlHP/giphy.gif',
];

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
  const [celebrationGif, setCelebrationGif] = useState<string | null>(null);
  const [estimating, setEstimating] = useState(false);
  const queryClient = useQueryClient();
  const lockMeal = useLockMeal();
  const warnings = recipe.warnings?.filter(Boolean) || [];
  const hasNutrition = recipe.calories != null;
  const totalTime = (recipe.prep_time_min || 0) + (recipe.cook_time_min || 0) || null;

  const handleEstimate = async () => {
    setEstimating(true);
    try {
      const { data, error } = await supabase.functions.invoke('estimate-nutrition', {
        body: { recipe_id: recipe.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Nutrition estimated!');
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    } catch (e: any) {
      toast.error(e.message || 'Failed to estimate nutrition');
    } finally {
      setEstimating(false);
    }
  };

  const handleLock = async (day: string) => {
    await lockMeal.mutateAsync({
      recipe_id: recipe.id,
      day,
      warnings_at_lock: warnings,
    });
    setShowSlotPicker(false);
    // Pick a random Colbert GIF
    const gif = COLBERT_GIFS[Math.floor(Math.random() * COLBERT_GIFS.length)];
    setCelebrationGif(gif);
    toast.success(`Picked "${recipe.title}" for ${day}`);
  };

  const handleCloseCelebration = () => {
    setCelebrationGif(null);
    onClose();
  };

  // Show celebration GIF overlay
  if (celebrationGif) {
    return (
      <Dialog open={true} onOpenChange={() => handleCloseCelebration()}>
        <DialogContent className="max-w-sm p-0 overflow-hidden bg-card border-border/50 text-center">
          <div className="p-6 space-y-4">
            <h2 className="font-serif text-xl text-foreground animate-scale-in">
              Great choice! 🎉
            </h2>
            <div className="rounded-lg overflow-hidden animate-fade-in">
              <img
                src={celebrationGif}
                alt="Stephen Colbert celebrating"
                className="w-full"
              />
            </div>
            <p className="text-sm text-muted-foreground italic">
              "{recipe.title}" is on the menu!
            </p>
            <Button onClick={handleCloseCelebration} className="w-full">
              Nice! 👏
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
        <div className="p-6 pt-4 space-y-4">
          {warnings.length > 0 && <WarningBox warnings={warnings} animate />}
          <StatusBar status={recipe.status} />
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-foreground capitalize">
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

          {/* Nutrition Stats */}
          {hasNutrition ? (
            <div className="rounded-lg bg-secondary/50 p-3 space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Per Serve (estimated)</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-lg font-semibold text-foreground">{recipe.calories}</p>
                  <p className="text-[10px] text-muted-foreground">cal</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-primary">{recipe.protein_g}g</p>
                  <p className="text-[10px] text-muted-foreground">protein</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{recipe.carbs_g}g</p>
                  <p className="text-[10px] text-muted-foreground">carbs</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{recipe.fat_g}g</p>
                  <p className="text-[10px] text-muted-foreground">fat</p>
                </div>
              </div>
              {totalTime && (
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-1">
                  <Clock className="w-3 h-3" />
                  {recipe.prep_time_min && <span>{recipe.prep_time_min}m prep</span>}
                  {recipe.prep_time_min && recipe.cook_time_min && <span>+</span>}
                  {recipe.cook_time_min && <span>{recipe.cook_time_min}m cook</span>}
                </div>
              )}
            </div>
          ) : recipe.ingredients ? (
            <Button
              variant="outline"
              onClick={handleEstimate}
              disabled={estimating}
              className="w-full gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {estimating ? 'Estimating...' : 'Estimate Nutrition'}
            </Button>
          ) : null}

          {!showSlotPicker ? (
            <Button
              onClick={() => preselectedDay ? handleLock(preselectedDay) : setShowSlotPicker(true)}
              className="w-full"
              disabled={lockMeal.isPending}
            >
              {preselectedDay ? `Pick for ${preselectedDay}` : 'Pick for...'}
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
