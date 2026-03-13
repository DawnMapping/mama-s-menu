import { useState } from 'react';
import { ViewToggle } from '@/components/ViewToggle';
import { MumView } from '@/components/MumView';
import { CookView } from '@/components/CookView';
import type { ViewMode } from '@/lib/types';

const Index = () => {
  const [mode, setMode] = useState<ViewMode>('mum');

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container flex items-center justify-between py-4">
          <h1 className="font-serif text-2xl text-foreground">
            Meal Planner
          </h1>
          <ViewToggle mode={mode} onChange={setMode} />
        </div>
      </header>
      <main className="container py-6">
        {mode === 'mum' ? <MumView /> : <CookView />}
      </main>
    </div>
  );
};

export default Index;
