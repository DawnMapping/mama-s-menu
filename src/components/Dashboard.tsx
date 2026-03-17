import { useMemo, useState, useEffect } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import { useLockedMeals } from '@/hooks/useLockedMeals';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useProfiles, useActiveProfileId, setActiveProfileId, type Profile } from '@/hooks/useProfiles';
import { MEAL_SLOTS } from '@/lib/types';
import { UtensilsCrossed, ChefHat, ShoppingCart, BookOpen, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function ProfilePicker({ profiles, activeId, onSelect }: {
  profiles: Profile[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {profiles.map(p => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            activeId === p.id
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          <span>{p.avatar_emoji}</span>
          <span>{p.name}</span>
        </button>
      ))}
    </div>
  );
}

function MacroRing({ label, value, target, emoji }: {
  label: string;
  value: number;
  target: number;
  emoji?: string;
}) {
  const pct = Math.min(Math.round((value / target) * 100), 100);
  const isOver = value > target;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.5" fill="none"
            stroke={isOver ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
            strokeWidth="3"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
          {pct}%
        </span>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{value}{label !== 'Calories' ? 'g' : ''}</p>
        <p className="text-[10px] text-muted-foreground">{emoji} {label}</p>
        <p className="text-[10px] text-muted-foreground">/ {target}{label !== 'Calories' ? 'g' : ''}</p>
      </div>
    </div>
  );
}

function WeeklyNutrition({ lockedMeals, profile }: {
  lockedMeals: any[] | undefined;
  profile: Profile;
}) {
  const weeklyMacros = useMemo(() => {
    let calories = 0, protein = 0, carbs = 0, fat = 0, mealsWithData = 0;
    if (lockedMeals?.length) {
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
    }
    return { calories: Math.round(calories), protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat), mealsWithData, totalMeals: lockedMeals?.length || 0 };
  }, [lockedMeals]);

  // Weekly targets = daily × 7
  const weekCal = profile.daily_calories_target * 7;
  const weekPro = profile.daily_protein_g_target * 7;
  const weekCarb = profile.daily_carbs_g_target * 7;
  const weekFat = profile.daily_fat_g_target * 7;

  return (
    <section className="rounded-xl border border-primary/20 bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg text-foreground">
          {profile.avatar_emoji} {profile.name}'s Week
        </h2>
        <span className="text-[11px] text-muted-foreground">
          {weeklyMacros.mealsWithData} of {weeklyMacros.totalMeals} meals tracked
        </span>
      </div>

      <div className="flex justify-around">
        <MacroRing label="Protein" value={weeklyMacros.protein} target={weekPro} emoji="🏋️" />
        <MacroRing label="Calories" value={weeklyMacros.calories} target={weekCal} emoji="🔥" />
        <MacroRing label="Carbs" value={weeklyMacros.carbs} target={weekCarb} />
        <MacroRing label="Fat" value={weeklyMacros.fat} target={weekFat} />
      </div>
    </section>
  );
}

export function Dashboard() {
  const { data: recipes } = useRecipes();
  const { data: lockedMeals } = useLockedMeals();
  const { data: shoppingItems } = useShoppingList();
  const { data: profiles } = useProfiles();
  const navigate = useNavigate();

  const [activeProfileId, setActiveProfile] = useState<string | null>(useActiveProfileId());

  // Auto-select first profile if none active
  useEffect(() => {
    if (!activeProfileId && profiles?.length) {
      const id = profiles[0].id;
      setActiveProfile(id);
      setActiveProfileId(id);
    }
  }, [profiles, activeProfileId]);

  const activeProfile = profiles?.find(p => p.id === activeProfileId) || null;

  const totalRecipes = recipes?.length || 0;
  const plannedMeals = lockedMeals?.length || 0;
  const DAYS_IN_WEEK = 7;
  const shoppingCount = shoppingItems?.filter(i => !i.checked).length || 0;
  const checkedCount = shoppingItems?.filter(i => i.checked).length || 0;

  const nextEmptySlot = MEAL_SLOTS.find(
    slot => !lockedMeals?.some(m => m.day === slot)
  );

  const handleProfileSelect = (id: string) => {
    setActiveProfile(id);
    setActiveProfileId(id);
  };

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
        {/* Profile Picker */}
        {profiles && profiles.length > 0 && (
          <ProfilePicker
            profiles={profiles}
            activeId={activeProfileId}
            onSelect={handleProfileSelect}
          />
        )}

        {/* Weekly Nutrition with targets */}
        {activeProfile && (
          <WeeklyNutrition lockedMeals={lockedMeals} profile={activeProfile} />
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
