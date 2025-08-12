import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MapPin, Bed, Bath, Square, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/property';
import { cn } from '@/lib/utils';

interface FavoritesListProps {
  user: User | null;
}

export function FavoritesList({ user }: FavoritesListProps) {
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get favorite properties with full property data
      const { data, error } = await supabase
        .from('property_favorites')
        .select(`
          property_id,
          properties (
            id,
            title,
            price,
            property_type,
            bedrooms,
            bathrooms,
            area_m2,
            address,
            city,
            images,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .eq('properties.is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const favoriteProperties = data
        ?.map(item => item.properties)
        .filter(Boolean) as Property[];

      setFavorites(favoriteProperties || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (propertyId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('property_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', propertyId);

      if (error) throw error;

      // Remove from local state
      setFavorites(prev => prev.filter(prop => prop.id !== propertyId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Skeleton className="h-20 w-32 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No tienes favoritos</h3>
          <p className="text-muted-foreground mb-4">
            Las propiedades que marques como favoritas aparecerán aquí.
          </p>
          <Button asChild>
            <Link to="/search">
              Explorar propiedades
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {favorites.map((property) => (
        <Card key={property.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Property Image */}
              <div className="relative">
                <img
                  src={Array.isArray(property.images) && property.images.length > 0 
                    ? property.images[0] 
                    : '/placeholder.svg'
                  }
                  alt={property.title}
                  className="h-20 w-32 object-cover rounded"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background"
                  onClick={() => removeFavorite(property.id)}
                >
                  <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                </Button>
              </div>

              {/* Property Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">{property.address}, {property.city}</span>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="font-bold text-sm">
                      {formatPrice(property.price)}
                    </div>
                  </div>
                </div>

                {/* Property Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {property.bedrooms > 0 && (
                    <div className="flex items-center">
                      <Bed className="h-3 w-3 mr-1" />
                      <span>{property.bedrooms}</span>
                    </div>
                  )}
                  {property.bathrooms > 0 && (
                    <div className="flex items-center">
                      <Bath className="h-3 w-3 mr-1" />
                      <span>{property.bathrooms}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Square className="h-3 w-3 mr-1" />
                    <span>{property.area_m2} m²</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/property/${property.id}`}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver detalles
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
