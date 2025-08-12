import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '@/components/search/SearchBar';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, SlidersHorizontal, Grid3X3, List } from 'lucide-react';
import { Property, SearchFilters } from '@/types/property';
import { supabase } from '@/integrations/supabase/client';

interface SearchResultsProps {
  user?: any;
}

export function SearchResults({ user }: SearchResultsProps) {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [totalCount, setTotalCount] = useState(0);

  const filters: SearchFilters = {
    query: searchParams.get('q') || '',
    category: (searchParams.get('category') as 'sale' | 'rent') || undefined,
    property_type: searchParams.get('property_type') || '',
    minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
    bedrooms: searchParams.get('bedrooms') ? parseInt(searchParams.get('bedrooms')!) : undefined,
    city: searchParams.get('city') || '',
  };

  useEffect(() => {
    loadProperties();
    if (user) {
      loadFavorites();
    }
  }, [searchParams, sortBy, user]);

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      // Apply filters
      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,address.ilike.%${filters.query}%,city.ilike.%${filters.query}%`);
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.property_type) {
        query = query.eq('property_type', filters.property_type);
      }
      
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      
      if (filters.bedrooms) {
        query = query.gte('bedrooms', filters.bedrooms);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'area-desc':
          query = query.order('area_m2', { ascending: false });
          break;
        default:
          query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
      }

      const { data, error, count } = await query.limit(20);

      if (error) throw error;

      setProperties(data || []);
      setTotalCount(count || 0);
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

  const getLocationSummary = () => {
    if (filters.city) {
      return filters.city;
    }
    if (filters.query) {
      return filters.query;
    }
    return 'España';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <div className="bg-muted/30 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <SearchBar variant="compact" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {totalCount} propiedades en {getLocationSummary()}
            </h1>
            {filters.category && (
              <p className="text-muted-foreground">
                {filters.category === 'sale' ? 'En venta' : 'En alquiler'}
                {filters.property_type && ` · ${filters.property_type}`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevancia</SelectItem>
                <SelectItem value="price-asc">Precio: menor a mayor</SelectItem>
                <SelectItem value="price-desc">Precio: mayor a menor</SelectItem>
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="area-desc">Mayor superficie</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index}>
                <Skeleton className="aspect-[4/3] w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-6"
          }>
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                user={user}
                isFavorite={favorites.has(property.id)}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <MapPin className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No se encontraron propiedades
            </h2>
            <p className="text-muted-foreground mb-6">
              Intenta ajustar los filtros de búsqueda para encontrar más resultados
            </p>
            <Button variant="outline">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Modificar filtros
            </Button>
          </Card>
        )}

        {/* Load More */}
        {properties.length > 0 && properties.length < totalCount && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Cargar más propiedades
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}