import { useShoppingList, useToggleShoppingItem, useGenerateShoppingList, useClearShoppingList } from '@/hooks/useShoppingList';
import { useLockedMeals } from '@/hooks/useLockedMeals';
import { ShoppingCart, RefreshCw, Trash2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ShoppingListView() {
  const { data: items, isLoading } = useShoppingList();
  const { data: lockedMeals } = useLockedMeals();
  const toggleItem = useToggleShoppingItem();
  const generateList = useGenerateShoppingList();
  const clearList = useClearShoppingList();
  const { toast } = useToast();

  const handleGenerate = async () => {
    const count = await generateList.mutateAsync();
    toast({ title: 'Shopping list generated', description: `${count} ingredients from ${lockedMeals?.length || 0} locked meals` });
  };

  const handleClear = () => {
    clearList.mutate(undefined, {
      onSuccess: () => toast({ title: 'Shopping list cleared' }),
    });
  };

  const checkedCount = items?.filter(i => i.checked).length || 0;
  const totalCount = items?.length || 0;

  // Group items by meal day
  const grouped = new Map<string, typeof items>();
  items?.forEach(item => {
    const key = item.meal_day || 'Other';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-foreground">Shopping List</h2>
        <div className="flex gap-2">
          {totalCount > 0 && (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={generateList.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generateList.isPending ? 'animate-spin' : ''}`} />
            {totalCount > 0 ? 'Regenerate' : 'Generate'} from Meals
          </button>
        </div>
      </div>

      {totalCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary/60 rounded-full transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
          <span>{checkedCount}/{totalCount} done</span>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-center py-12">Loading...</p>
      ) : totalCount === 0 ? (
        <div className="text-center py-16 space-y-3">
          <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">No shopping list yet</p>
          <p className="text-xs text-muted-foreground">
            Lock meals in the planner, then generate your shopping list
          </p>
          {(lockedMeals?.length || 0) > 0 && (
            <button
              onClick={handleGenerate}
              disabled={generateList.isPending}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <RefreshCw className={`w-4 h-4 ${generateList.isPending ? 'animate-spin' : ''}`} />
              Generate from {lockedMeals?.length} locked meal{lockedMeals?.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([day, dayItems]) => (
            <div key={day} className="space-y-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {day}
              </h3>
              <div className="rounded-lg border border-border/50 bg-card divide-y divide-border/30">
                {dayItems?.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem.mutate({ id: item.id, checked: !item.checked })}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-secondary/30 transition-colors"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      item.checked 
                        ? 'bg-primary/20 border-primary/40' 
                        : 'border-border'
                    }`}>
                      {item.checked && <Check className="w-3 h-3 text-primary" />}
                    </div>
                    <span className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {item.ingredient}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
