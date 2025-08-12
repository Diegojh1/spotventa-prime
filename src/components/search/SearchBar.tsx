import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, SlidersHorizontal } from 'lucide-react';
import { SearchFilters } from '@/types/property';

interface SearchBarProps {
  variant?: 'hero' | 'compact';
  onSearch?: (filters: SearchFilters) => void;
  className?: string;
}

export function SearchBar({ variant = 'compact', onSearch, className }: SearchBarProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    category: (searchParams.get('category') as 'sale' | 'rent') || 'sale',
    property_type: searchParams.get('property_type') || '',
    minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
    bedrooms: searchParams.get('bedrooms') ? parseInt(searchParams.get('bedrooms')!) : undefined,
    city: searchParams.get('city') || '',
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        params.set(key, value.toString());
      }
    });

    if (onSearch) {
      onSearch(filters);
    } else {
      navigate(`/search?${params.toString()}`);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const isHero = variant === 'hero';

  return (
    <Card className={`${className} ${isHero ? 'bg-gradient-hero shadow-hero' : 'bg-background shadow-card'}`}>
      <CardContent className={`${isHero ? 'p-8' : 'p-4'}`}>
        {isHero && (
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Tu casa es donde están tus libros
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Encuentra tu hogar ideal entre miles de propiedades en España
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* Main Search Controls */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Transaction Type */}
            <div className="flex bg-background rounded-lg p-1 min-w-fit">
              <Button
                type="button"
                variant={filters.category === 'sale' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => updateFilter('category', 'sale')}
                className="rounded-md"
              >
                Comprar
              </Button>
              <Button
                type="button"
                variant={filters.category === 'rent' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => updateFilter('category', 'rent')}
                className="rounded-md"
              >
                Alquilar
              </Button>
            </div>

            {/* Property Type */}
            <Select value={filters.property_type} onValueChange={(value) => updateFilter('property_type', value)}>
              <SelectTrigger className="md:w-48 bg-background">
                <SelectValue placeholder="Tipo de propiedad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los tipos</SelectItem>
                <SelectItem value="apartment">Apartamento</SelectItem>
                <SelectItem value="house">Casa</SelectItem>
                <SelectItem value="penthouse">Ático</SelectItem>
                <SelectItem value="studio">Estudio</SelectItem>
                <SelectItem value="office">Oficina</SelectItem>
              </SelectContent>
            </Select>

            {/* Location Search */}
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Barrio, ciudad, zona, metro..."
                value={filters.query}
                onChange={(e) => updateFilter('query', e.target.value)}
                className="bg-background pr-12"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {/* Filters Toggle */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-background"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>

            {/* Search Button */}
            <Button onClick={handleSearch} className="bg-accent-pink hover:bg-accent-pink/90 text-accent-pink-foreground px-8">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4 border-t border-border">
              <Select value={filters.bedrooms?.toString() || ''} onValueChange={(value) => updateFilter('bedrooms', value ? parseInt(value) : undefined)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Habitaciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Cualquiera</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Precio mínimo"
                value={filters.minPrice || ''}
                onChange={(e) => updateFilter('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                className="bg-background"
              />

              <Input
                type="number"
                placeholder="Precio máximo"
                value={filters.maxPrice || ''}
                onChange={(e) => updateFilter('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                className="bg-background"
              />

              <Input
                type="text"
                placeholder="Ciudad"
                value={filters.city}
                onChange={(e) => updateFilter('city', e.target.value)}
                className="bg-background"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}