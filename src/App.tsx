import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import { Home } from "./pages/Home";
import { SearchResults } from "./pages/SearchResults";
import { PropertyDetail } from "./pages/PropertyDetail";
import { Profile } from "./pages/Profile";
import { PublishProperty } from "./pages/PublishProperty";
import { EditProperty } from "./pages/EditProperty";
import { Auth } from "./pages/Auth";
import { MapSearch } from "./pages/MapSearch";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Componente para resetear el scroll al navegar
function ScrollToTop() {
  const location = useLocation();
  
  useEffect(() => {
    // Resetear scroll al inicio de la página
    window.scrollTo(0, 0);
    
    // También resetear el scroll del body para asegurar que no haya scroll residual
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, [location.pathname]);

  return null;
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col">
            <Navbar user={user} />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchResults user={user} />} />
                <Route path="/property/:id" element={<PropertyDetail user={user} />} />
                <Route path="/profile" element={<Profile user={user} />} />
                <Route path="/publish" element={<PublishProperty user={user} />} />
                <Route path="/edit-property/:id" element={<EditProperty user={user} />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/map" element={<MapSearch user={user} />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};
export default App;
