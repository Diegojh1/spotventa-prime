import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchBar } from '@/components/search/SearchBar';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, MapPin, Users, Star, ArrowRight, Heart } from 'lucide-react';
import { Property } from '@/types/property';
import { supabase } from '@/integrations/supabase/client';

interface HomeProps {
  user?: any;
}

export function Home({ user }: HomeProps) {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProperties();
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadProperties = async () => {
    try {
      // Load featured properties
      const { data: featured } = await supabase
        .from('properties')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .limit(4);

      // Load recent properties
      const { data: recent } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8);

      setFeaturedProperties(featured || []);
      setRecentProperties(recent || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('favorites')
      .select('property_id')
      .eq('user_id', user.id);

    if (data) {
      setFavorites(new Set(data.map(fav => fav.property_id)));
    }
  };

  const handleFavoriteChange = (propertyId: string, isFavorite: boolean) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (isFavorite) {
        newFavorites.add(propertyId);
      } else {
        newFavorites.delete(propertyId);
      }
      return newFavorites;
    });
  };

  const stats = [
    { icon: TrendingUp, label: 'Propiedades activas', value: '24.747' },
    { icon: MapPin, label: 'Ciudades', value: '500+' },
    { icon: Users, label: 'Usuarios registrados', value: '100K+' },
    { icon: Star, label: 'Valoración media', value: '4.8' },
  ];

  const popularLocations = [
    { name: 'Madrid', count: '13.007 propiedades', image: '/placeholder.svg' },
    { name: 'Barcelona', count: '8.542 propiedades', image: '/placeholder.svg' },
    { name: 'Valencia', count: '4.832 propiedades', image: '/placeholder.svg' },
    { name: 'Sevilla', count: '3.421 propiedades', image: '/placeholder.svg' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <SearchBar variant="hero" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-lg mb-4">
                  <stat.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      {featuredProperties.length > 0 && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Propiedades destacadas
                </h2>
                <p className="text-muted-foreground">
                  Las mejores propiedades seleccionadas para ti
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/search?featured=true">
                  Ver todas <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  user={user}
                  isFavorite={favorites.has(property.id)}
                  onFavoriteChange={handleFavoriteChange}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Locations */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Busca inmuebles por provincia y municipio
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explora las mejores oportunidades inmobiliarias en las principales ciudades de España
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularLocations.map((location, index) => (
              <Card key={index} className="group cursor-pointer hover:shadow-card-hover transition-all duration-300">
                <Link to={`/search?city=${encodeURIComponent(location.name)}`}>
                  <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
                    <img
                      src={location.image}
                      alt={location.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {location.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{location.count}</p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Properties */}
      {recentProperties.length > 0 && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Propiedades recientes
                </h2>
                <p className="text-muted-foreground">
                  Las últimas propiedades añadidas a la plataforma
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/search">
                  Ver todas <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentProperties.slice(0, 8).map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  user={user}
                  isFavorite={favorites.has(property.id)}
                  onFavoriteChange={handleFavoriteChange}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-4">
            ¿Tienes una propiedad para vender?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Únete a miles de propietarios que confían en SpotVenta para vender sus propiedades
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/dashboard">
                Publicar propiedad gratis
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Saber más
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}