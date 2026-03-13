import { useState } from 'react';
import { MumView } from '@/components/MumView';
import { CookView } from '@/components/CookView';
import { ShoppingListView } from '@/components/ShoppingListView';
import { ResourcesView } from '@/components/ResourcesView';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BookOpen, ShoppingCart, ChefHat, UtensilsCrossed } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container py-4">
          <h1 className="font-serif text-2xl text-foreground">
            Meal Planner
          </h1>
        </div>
      </header>
      <main className="container py-4">
        <Tabs defaultValue="planner" className="space-y-4">
          <TabsList className="w-full grid grid-cols-4 h-auto p-1">
            <TabsTrigger value="planner" className="flex flex-col items-center gap-0.5 py-2 text-xs">
              <UtensilsCrossed className="w-4 h-4" />
              Planner
            </TabsTrigger>
            <TabsTrigger value="cook" className="flex flex-col items-center gap-0.5 py-2 text-xs">
              <ChefHat className="w-4 h-4" />
              Cook
            </TabsTrigger>
            <TabsTrigger value="shopping" className="flex flex-col items-center gap-0.5 py-2 text-xs">
              <ShoppingCart className="w-4 h-4" />
              Shopping
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex flex-col items-center gap-0.5 py-2 text-xs">
              <BookOpen className="w-4 h-4" />
              Resources
            </TabsTrigger>
          </TabsList>
          <TabsContent value="planner">
            <MumView />
          </TabsContent>
          <TabsContent value="cook">
            <CookView />
          </TabsContent>
          <TabsContent value="shopping">
            <ShoppingListView />
          </TabsContent>
          <TabsContent value="resources">
            <ResourcesView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
