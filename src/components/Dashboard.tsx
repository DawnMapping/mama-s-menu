import { useMemo } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import { useLockedMeals } from '@/hooks/useLockedMeals';
import { useShoppingList } from '@/hooks/useShoppingList';
import { MEAL_SLOTS } from '@/lib/types';
import { UtensilsCrossed, ChefHat, ShoppingCart, BookOpen, Check, ArrowRight, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { data: recipes } = useRecipes();
  const { data: lockedMeals } = useLockedMeals();
  const { data: shoppingItems } = useShoppingList();
  const navigate = useNavigate();

  const totalRecipes = recipes?.length || 0;
  const plannedMeals = lockedMeals?.length || 0;
  const DAYS_IN_WEEK = 7;
  const shoppingCount = shoppingItems?.filter(i => !i.checked).length || 0;
  const checkedCount = shoppingItems?.filter(i => i.checked).length || 0;

  const nextEmptySlot = MEAL_SLOTS.find(
    slot => !lockedMeals?.some(m => m.day === slot)
  );

  // Weekly macro totals from picked meals
  const weeklyMacros = useMemo(() => {
    if (!lockedMeals?.length) return null;
    let calories = 0, protein = 0, carbs = 0, fat = 0;
    let mealsWithData = 0;
    for (const meal of lockedMeals) {
      const r = meal.recipes;
      if (r?.calories != null) {
        calories += r.calories;
        protein += r.protein_g || 0;
        carbs += r.carbs_g || 0;
        fat += r.fat_g || 0;
        mealsWithData++;
      }
    }
    if (mealsWithData === 0) return null;
    return {
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      mealsWithData,
      totalMeals: lockedMeals.length,
      avgCalories: Math.round(calories / mealsWithData),
      avgProtein: Math.round(protein / mealsWithData),
    };
  }, [lockedMeals]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container py-5">
          <h1 className="font-serif text-3xl text-foreground tracking-tight">
            Meal Planner
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Your weekly kitchen companion</p>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Weekly Macros */}
        {weeklyMacros && (
          <section className="rounded-xl border border-primary/20 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg text-foreground">Weekly Nutrition</h2>
              <span className="text-[11px] text-muted-foreground">
                {weeklyMacros.mealsWithData} of {weeklyMacros.totalMeals} meals tracked
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="rounded-lg bg-primary/10 p-3">
                <p className="text-2xl font-bold text-primary">{weeklyMacros.protein}g</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">🏋️ protein</p>
              </div>
              <div className="rounded-lg bg-secondary/60 p-3">
                <p className="text-2xl font-bold text-foreground">{weeklyMacros.calories}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">🔥 calories</p>
              </div>
              <div className="rounded-lg bg-secondary/60 p-3">
                <p className="text-2xl font-bold text-foreground">{weeklyMacros.carbs}g</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">carbs</p>
              </div>
              <div className="rounded-lg bg-secondary/60 p-3">
                <p className="text-2xl font-bold text-foreground">{weeklyMacros.fat}g</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">fat</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
              <span>Avg per meal: <strong className="text-foreground">{weeklyMacros.avgCalories} cal</strong></span>
              <span className="text-border">|</span>
              <span>Avg protein: <strong className="text-primary">{weeklyMacros.avgProtein}g</strong></span>
            </div>
          </section>
        )}

        {/* This Week Summary */}
        <section className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
          <h2 className="font-serif text-lg text-foreground">This Week</h2>
          
          {plannedMeals > 0 ? (
            <div className="space-y-2">
              {lockedMeals?.slice(0, 4).map(meal => (
                <div key={meal.id} className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground w-28 shrink-0">{meal.day}</span>
                  <span className="text-sm font-serif text-foreground truncate">{meal.recipes?.title}</span>
                </div>
              ))}
              {plannedMeals > 4 && (
                <p className="text-xs text-muted-foreground pl-6">
                  +{plannedMeals - 4} more planned
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No meals planned yet. Start by browsing recipes!</p>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{plannedMeals} of {DAYS_IN_WEEK} days planned</span>
              <span>{Math.round((plannedMeals / DAYS_IN_WEEK) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(plannedMeals / DAYS_IN_WEEK) * 100}%` }}
              />
            </div>
          </div>
        </section>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/planner')}
            className="flex flex-col items-start gap-3 rounded-xl border border-border/50 bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all text-left group"
          >
            <div className="p-2 rounded-lg bg-primary/10">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Planner</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {nextEmptySlot ? `Next: ${nextEmptySlot}` : 'All slots filled!'}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors self-end" />
          </button>

          <button
            onClick={() => navigate('/cook')}
            className="flex flex-col items-start gap-3 rounded-xl border border-border/50 bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all text-left group"
          >
            <div className="p-2 rounded-lg bg-accent/20">
              <ChefHat className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Cook</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {plannedMeals} recipe{plannedMeals !== 1 ? 's' : ''} ready
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors self-end" />
          </button>

          <button
            onClick={() => navigate('/shopping')}
            className="flex flex-col items-start gap-3 rounded-xl border border-border/50 bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all text-left group"
          >
            <div className="p-2 rounded-lg bg-status-green/20">
              <ShoppingCart className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Shopping</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {shoppingCount > 0 ? `${shoppingCount} items left` : 'List empty'}
                {checkedCount > 0 && ` · ${checkedCount} done`}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors self-end" />
          </button>

          <button
            onClick={() => navigate('/resources')}
            className="flex flex-col items-start gap-3 rounded-xl border border-border/50 bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all text-left group"
          >
            <div className="p-2 rounded-lg bg-gold/20">
              <BookOpen className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Resources</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalRecipes} recipes in library
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors self-end" />
          </button>
        </div>
      </main>
    </div>
  );
}
