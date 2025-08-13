import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Home
} from 'lucide-react';

interface SearchFilters {
  query: string;
  category: 'sale' | 'rent';
  property_type: string;
  maxPrice?: number;
  city?: string;
}

interface SearchBarProps {
  className?: string;
  variant?: 'default' | 'hero';
}

export default function SearchBar({ className = '', variant = 'default' }: SearchBarProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    category: (searchParams.get('category') as 'sale' | 'rent') || 'sale',
    property_type: searchParams.get('type') || ''
  });

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.category) params.set('category', filters.category);
    if (filters.property_type) params.set('type', filters.property_type);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());

    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Barra de búsqueda principal - Siempre visible */}
          <div className="p-6">
            <div className="flex items-center gap-4">
              {/* Logo SPOTVENTA */}
              <div className="flex items-center gap-2">
                <img src="/LogoSolo.png" alt="SpotVenta" className="h-8 w-8" />
                <span className="text-xl font-bold text-black">SpotVenta</span>
              </div>

              {/* Campo: Comprar/Alquilar */}
              <Select 
                value={filters.category} 
                onValueChange={(value) => updateFilter('category', value)}
              >
                <SelectTrigger className="h-12 w-32 bg-white border-gray-300 text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Comprar</SelectItem>
                  <SelectItem value="rent">Alquilar</SelectItem>
                </SelectContent>
              </Select>

              {/* Campo: Tipo de vivienda */}
              <Select 
                value={filters.property_type || 'all'} 
                onValueChange={(value) => updateFilter('property_type', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="h-12 w-36 bg-white border-gray-300 text-sm font-medium">
                  <SelectValue placeholder="Viviendas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Viviendas</SelectItem>
                  <SelectItem value="Apartamento">Apartamento</SelectItem>
                  <SelectItem value="Casa">Casa</SelectItem>
                  <SelectItem value="Ático">Ático</SelectItem>
                  <SelectItem value="Dúplex">Dúplex</SelectItem>
                  <SelectItem value="Estudio">Estudio</SelectItem>
                </SelectContent>
              </Select>

              {/* Campo: Ubicación (barra de búsqueda principal) */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="¿Dónde quieres vivir?"
                  value={filters.query}
                  onChange={(e) => updateFilter('query', e.target.value)}
                  className="h-12 pl-12 pr-4 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              {/* Campo: Precio máximo */}
              <Select 
                value={filters.maxPrice?.toString() || 'any'} 
                onValueChange={(value) => updateFilter('maxPrice', value === 'any' ? undefined : parseInt(value))}
              >
                <SelectTrigger className="h-12 w-40 bg-white border-gray-300 text-sm font-medium">
                  <SelectValue placeholder="Precio máximo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Sin límite</SelectItem>
                  <SelectItem value="100000">100.000€</SelectItem>
                  <SelectItem value="200000">200.000€</SelectItem>
                  <SelectItem value="300000">300.000€</SelectItem>
                  <SelectItem value="500000">500.000€</SelectItem>
                  <SelectItem value="1000000">1.000.000€</SelectItem>
                </SelectContent>
              </Select>

              {/* Botón de búsqueda */}
              <Button 
                onClick={handleSearch}
                className="h-12 bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-lg font-medium text-base"
              >
                Buscar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}