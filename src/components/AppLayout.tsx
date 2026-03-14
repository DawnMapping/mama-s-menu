import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { UtensilsCrossed, ChefHat, ShoppingCart, BookOpen, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/planner', icon: UtensilsCrossed, label: 'Planner' },
  { path: '/cook', icon: ChefHat, label: 'Cook' },
  { path: '/shopping', icon: ShoppingCart, label: 'Shopping' },
  { path: '/resources', icon: BookOpen, label: 'Resources' },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Dashboard has its own header
  if (location.pathname === '/') {
    return (
      <>
        <Outlet />
        <BottomNav navigate={navigate} currentPath={location.pathname} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container py-4">
          <h1 className="font-serif text-2xl text-foreground">Meal Planner</h1>
        </div>
      </header>
      <main className="container py-4">
        <Outlet />
      </main>
      <BottomNav navigate={navigate} currentPath={location.pathname} />
    </div>
  );
}

function BottomNav({ navigate, currentPath }: { navigate: (path: string) => void; currentPath: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-card/95 backdrop-blur-sm border-t border-border/50">
      <div className="container flex justify-around py-2">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={cn(
              'flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors text-xs',
              currentPath === path
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
