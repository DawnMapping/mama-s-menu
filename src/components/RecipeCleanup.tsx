import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, ChefHat, XCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

interface Classification {
  id: string;
  title: string;
  status: string;
  category: 'dinner' | 'not_dinner';
  reason: string;
}

interface RecipeCleanupProps {
  onBack: () => void;
}

export function RecipeCleanup({ onBack }: RecipeCleanupProps) {
  const [classifications, setClassifications] = useState<Classification[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, 'dinner' | 'not_dinner'>>({});
  const { toast } = useToast();
  const qc = useQueryClient();

  const handleClassify = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('classify-recipes');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setClassifications(data.classifications);
    } catch (err: any) {
      toast({ title: 'Classification failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getCategory = (c: Classification) => overrides[c.id] || c.category;

  const toRemove = classifications?.filter(c => {
    const cat = getCategory(c);
    return cat === 'not_dinner' || c.status === 'red';
  }) || [];

  const toKeep = classifications?.filter(c => {
    const cat = getCategory(c);
    return cat === 'dinner' && c.status !== 'red';
  }) || [];

  const toggleOverride = (id: string, current: 'dinner' | 'not_dinner') => {
    setOverrides(prev => ({
      ...prev,
      [id]: current === 'dinner' ? 'not_dinner' : 'dinner',
    }));
  };

  const handleDelete = async () => {
    if (!toRemove.length) return;
    setDeleting(true);
    try {
      const ids = toRemove.map(r => r.id);
      // Delete in batches of 20
      for (let i = 0; i < ids.length; i += 20) {
        const batch = ids.slice(i, i + 20);
        const { error } = await supabase
          .from('recipes')
          .delete()
          .in('id', batch);
        if (error) throw error;
      }
      // Also clean up any locked meals referencing deleted recipes
      await supabase.from('locked_meals').delete().in('recipe_id', ids);
      await supabase.from('shopping_list_items').delete().in('recipe_id', ids);
      
      qc.invalidateQueries({ queryKey: ['recipes'] });
      qc.invalidateQueries({ queryKey: ['locked-meals'] });
      qc.invalidateQueries({ queryKey: ['shopping-list'] });
      toast({ title: `Removed ${ids.length} recipes`, description: `Kept ${toKeep.length} dinner recipes` });
      setClassifications(null);
      onBack();
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  if (!classifications) {
    return (
      <div className="space-y-5">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Resources
        </button>
        <div className="text-center py-16 space-y-4">
          <ChefHat className="w-16 h-16 mx-auto text-muted-foreground/30" />
          <h2 className="font-serif text-xl text-foreground">Recipe Cleanup</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            AI will classify all your recipes as dinner or non-dinner. You'll review the list before anything gets deleted.
            Red-status recipes (with banned ingredients) will also be marked for removal.
          </p>
          <button
            onClick={handleClassify}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Classifying recipes…</>
            ) : (
              <><ChefHat className="w-4 h-4" /> Classify Recipes</>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Resources
      </button>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-serif text-xl text-foreground">Review Classifications</h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            <span className="text-foreground font-semibold">{toKeep.length}</span> keeping · 
            <span className="text-destructive font-semibold ml-1">{toRemove.length}</span> removing
          </span>
          <button
            onClick={handleDelete}
            disabled={deleting || toRemove.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {deleting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</>
            ) : (
              <><Trash2 className="w-4 h-4" /> Remove {toRemove.length} recipes</>
            )}
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Click any recipe to toggle its classification. Red-status recipes are always removed.</p>

      {/* Recipes to REMOVE */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-destructive flex items-center gap-1.5">
          <XCircle className="w-4 h-4" /> Removing ({toRemove.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {toRemove.map(c => (
            <button
              key={c.id}
              onClick={() => c.status !== 'red' && toggleOverride(c.id, getCategory(c))}
              disabled={c.status === 'red'}
              className={`text-left px-3 py-2 rounded-md text-sm border transition-colors ${
                c.status === 'red'
                  ? 'border-destructive/30 bg-destructive/5 opacity-60 cursor-not-allowed'
                  : 'border-border/50 bg-card hover:border-primary/40'
              }`}
            >
              <span className="text-foreground">{c.title}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {c.status === 'red' ? '🚫 banned' : c.reason}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Recipes to KEEP */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-primary flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> Keeping ({toKeep.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {toKeep.map(c => (
            <button
              key={c.id}
              onClick={() => toggleOverride(c.id, getCategory(c))}
              className="text-left px-3 py-2 rounded-md text-sm border border-border/50 bg-card hover:border-destructive/40 transition-colors"
            >
              <span className="text-foreground">{c.title}</span>
              <span className="text-xs text-muted-foreground ml-2">{c.reason}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
