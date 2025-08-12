import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Search, 
  X, 
  Home, 
  Building2, 
  Euro,
  Bed,
  Bath,
  Square,
  Filter,
  Eraser,
  Save,
  Loader2,
  MousePointer
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';

// Fix para los iconos de Leaflet en React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Property {
  id: string;
  title: string;
  price: number;
  property_type: string;
  category: string;
  city: string;
  latitude: number;
  longitude: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
}

interface MapSearchProps {
  user?: any;
}

// Componente para manejar el centro del mapa
function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

// Componente para las herramientas de dibujo
function DrawingTools({ onDrawCreated, onDrawEdited, onDrawDeleted }: {
  onDrawCreated: (e: any) => void;
  onDrawEdited: (e: any) => void;
  onDrawDeleted: (e: any) => void;
}) {
  const map = useMap();
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  useEffect(() => {
    if (!featureGroupRef.current) {
      featureGroupRef.current = new L.FeatureGroup();
      map.addLayer(featureGroupRef.current);
    }
  }, [map]);

  return (
    <FeatureGroup ref={featureGroupRef}>
      <EditControl
        position="topright"
        onCreated={onDrawCreated}
        onEdited={onDrawEdited}
        onDeleted={onDrawDeleted}
        draw={{
          rectangle: {
            shapeOptions: {
              color: '#3b82f6',
              weight: 2,
              fillOpacity: 0.2
            }
          },
          polygon: {
            shapeOptions: {
              color: '#3b82f6',
              weight: 2,
              fillOpacity: 0.2
            }
          },
          circle: {
            shapeOptions: {
              color: '#3b82f6',
              weight: 2,
              fillOpacity: 0.2
            }
          },
          marker: false,
          polyline: false,
          circlemarker: false
        }}
                 edit={{
           remove: true
         }}
      />
    </FeatureGroup>
  );
}

export function PropertyMap({ user }: MapSearchProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawnArea, setDrawnArea] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.4168, -3.7492]); // Madrid
  const [filters, setFilters] = useState({
    priceMin: 0,
    priceMax: 1000000,
    propertyType: 'all',
    category: 'all',
    bedrooms: 'any'
  });
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const mapRef = useRef<L.Map>(null);

  // Cargar propiedades al montar el componente
  useEffect(() => {
    loadProperties();
  }, []);

  // Filtrar propiedades cuando cambian los filtros
  useEffect(() => {
    console.log('Filtrando propiedades...', {
      totalProperties: properties.length,
      drawnArea: drawnArea,
      filters: filters
    });
    filterProperties();
  }, [properties, filters, drawnArea]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error loading properties:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las propiedades",
          variant: "destructive"
        });
      } else {
        // Mapear los datos para que coincidan con la interfaz Property
        const mappedData = (data || []).map(prop => ({
          id: prop.id,
          title: prop.title,
          price: prop.price,
          property_type: prop.property_type,
          category: prop.category,
          city: prop.city,
          latitude: prop.latitude || 0,
          longitude: prop.longitude || 0,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          area: prop.area_m2 || 0,
          images: Array.isArray(prop.images) ? prop.images : []
        })) as Property[];
        setProperties(mappedData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = properties;

    // Filtrar por área dibujada
    if (drawnArea && drawnArea.geometry) {
      console.log('Filtrando por área dibujada:', drawnArea);
      filtered = filtered.filter(property => {
        // Verificar que la propiedad tenga coordenadas válidas
        if (!property.latitude || !property.longitude) {
          console.log('Propiedad sin coordenadas válidas:', property.title);
          return false;
        }

        // Manejar diferentes tipos de geometría
        if (drawnArea.geometry.type === 'Polygon') {
          const isInside = isPointInPolygon(
            property.longitude,
            property.latitude,
            drawnArea.geometry.coordinates[0]
          );
          console.log(`Propiedad ${property.title}: ${isInside ? 'DENTRO' : 'FUERA'} del polígono`);
          return isInside;
        } else if (drawnArea.geometry.type === 'Point' && drawnArea.properties?.radius) {
          // Para círculos
          const center = drawnArea.geometry.coordinates;
          const distance = calculateDistance(
            center[1], // lat
            center[0], // lng
            property.latitude,
            property.longitude
          );
          const radius = drawnArea.properties.radius; // radio en metros
          const isInside = distance <= radius;
          console.log(`Propiedad ${property.title}: distancia ${distance}m, radio ${radius}m, ${isInside ? 'DENTRO' : 'FUERA'} del círculo`);
          return isInside;
        }
        
        return false;
      });
    }

    // Filtrar por precio
    filtered = filtered.filter(property => 
      property.price >= filters.priceMin && property.price <= filters.priceMax
    );

    // Filtrar por tipo de propiedad
    if (filters.propertyType !== 'all') {
      filtered = filtered.filter(property => 
        property.property_type === filters.propertyType
      );
    }

    // Filtrar por categoría
    if (filters.category !== 'all') {
      filtered = filtered.filter(property => 
        property.category === filters.category
      );
    }

    // Filtrar por habitaciones
    if (filters.bedrooms !== 'any') {
      const bedrooms = parseInt(filters.bedrooms);
      filtered = filtered.filter(property => 
        property.bedrooms >= bedrooms
      );
    }

    console.log(`Filtrado completado: ${filtered.length} propiedades de ${properties.length} totales`);
    setFilteredProperties(filtered);
  };

  // Función para verificar si un punto está dentro de un polígono
  const isPointInPolygon = (lon: number, lat: number, polygon: number[][]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      
      if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Función para calcular distancia entre dos puntos (fórmula de Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const toggleDrawingMode = () => {
    const newDrawingMode = !drawingMode;
    setDrawingMode(newDrawingMode);
    
    // Toast más sutil para evitar desplazamientos
    if (newDrawingMode) {
      toast({
        title: "Modo dibujo activado",
        description: "Herramientas disponibles en la esquina superior derecha",
        duration: 2000,
      });
    } else {
      toast({
        title: "Modo dibujo desactivado",
        duration: 1500,
      });
    }
  };

  const clearDrawnArea = () => {
    setDrawnArea(null);
    setDrawingMode(false);
    toast({
      title: "Zona limpiada",
      description: "Se ha limpiado la zona dibujada",
    });
  };

  const handleDrawCreated = (e: any) => {
    const { layer } = e;
    
    let geoJson;
    
    try {
      if (layer instanceof L.Circle) {
        // Para círculos
        const center = layer.getLatLng();
        const radius = layer.getRadius();
        geoJson = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [center.lng, center.lat]
          },
          properties: {
            radius: radius
          }
        };
      } else if (layer instanceof L.Rectangle || layer instanceof L.Polygon) {
        // Para rectángulos y polígonos
        const coordinates = layer.getLatLngs();
        const coordsArray: number[][] = [];
        
        // Manejar diferentes estructuras de coordenadas
        const latLngs = Array.isArray(coordinates[0]) ? coordinates[0] : coordinates;
        
        for (let i = 0; i < latLngs.length; i++) {
          const latlng = latLngs[i] as any;
          if (latlng && typeof latlng.lng === 'number' && typeof latlng.lat === 'number') {
            coordsArray.push([latlng.lng, latlng.lat]);
          }
        }
        
        if (coordsArray.length >= 3) { // Mínimo 3 puntos para un polígono válido
          geoJson = {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [coordsArray]
            }
          };
        }
      }

      if (geoJson) {
        setDrawnArea(geoJson);
        console.log('Área dibujada:', geoJson); // Debug
        toast({
          title: "Zona dibujada",
          description: "Se ha creado una nueva zona de búsqueda",
        });
      }
    } catch (error) {
      console.error('Error al procesar el área dibujada:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el área dibujada",
        variant: "destructive"
      });
    }
  };

  const handleDrawEdited = (e: any) => {
    const layers = e.layers;
    layers.eachLayer((layer: any) => {
      const coordinates = layer.getLatLngs ? layer.getLatLngs() : [layer.getLatLng()];
      const geoJson = {
        type: "Feature",
        geometry: {
          type: layer instanceof L.Circle ? "Point" : "Polygon",
          coordinates: coordinates.map((latlng: L.LatLng) => [latlng.lng, latlng.lat])
        }
      };
      setDrawnArea(geoJson);
    });
  };

  const handleDrawDeleted = (e: any) => {
    setDrawnArea(null);
    toast({
      title: "Zona eliminada",
      description: "Se ha eliminado la zona dibujada",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex overflow-hidden relative z-0">
      {/* Panel lateral */}
      <div className="w-96 bg-background border-r flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <div className="p-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Búsqueda en Mapa</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>

          {/* Herramientas de dibujo */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={drawingMode ? "default" : "outline"}
              size="sm"
              onClick={toggleDrawingMode}
            >
              <MousePointer className="h-4 w-4 mr-2" />
              {drawingMode ? "Dibujando..." : "Dibujar zona"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearDrawnArea}
            >
              <Eraser className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>

          {/* Instrucciones de dibujo */}
          {drawingMode && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Instrucciones:</strong> Usa las herramientas en la esquina superior derecha del mapa:
              </p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• <strong>Rectángulo:</strong> Dibuja un área rectangular</li>
                <li>• <strong>Polígono:</strong> Dibuja un área personalizada</li>
                <li>• <strong>Círculo:</strong> Dibuja un área circular</li>
                <li>• <strong>Editar/Eliminar:</strong> Modifica o elimina zonas</li>
              </ul>
            </div>
          )}

          {/* Filtros */}
          {showFilters && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Filtros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rango de precio */}
                <div className="space-y-2">
                  <Label className="text-sm">Rango de precio</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Mín"
                      value={filters.priceMin}
                      onChange={(e) => setFilters({
                        ...filters,
                        priceMin: parseInt(e.target.value) || 0
                      })}
                    />
                    <Input
                      type="number"
                      placeholder="Máx"
                      value={filters.priceMax}
                      onChange={(e) => setFilters({
                        ...filters,
                        priceMax: parseInt(e.target.value) || 1000000
                      })}
                    />
                  </div>
                </div>

                {/* Tipo de propiedad */}
                <div className="space-y-2">
                  <Label className="text-sm">Tipo de propiedad</Label>
                  <Select
                    value={filters.propertyType}
                    onValueChange={(value) => setFilters({
                      ...filters,
                      propertyType: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Apartamento">Apartamento</SelectItem>
                      <SelectItem value="Casa">Casa</SelectItem>
                      <SelectItem value="Piso">Piso</SelectItem>
                      <SelectItem value="Dúplex">Dúplex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Categoría */}
                <div className="space-y-2">
                  <Label className="text-sm">Categoría</Label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters({
                      ...filters,
                      category: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="sale">Venta</SelectItem>
                      <SelectItem value="rent">Alquiler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Habitaciones */}
                <div className="space-y-2">
                  <Label className="text-sm">Habitaciones mínimas</Label>
                  <Select
                    value={filters.bedrooms}
                    onValueChange={(value) => setFilters({
                      ...filters,
                      bedrooms: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Cualquiera</SelectItem>
                      <SelectItem value="1">1+</SelectItem>
                      <SelectItem value="2">2+</SelectItem>
                      <SelectItem value="3">3+</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filteredProperties.length} propiedades encontradas</span>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </div>

        {/* Lista de propiedades */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredProperties.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Cargando propiedades...
                </div>
              ) : (
                <div>
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron propiedades en esta zona</p>
                  <p className="text-sm">Intenta ajustar los filtros o dibujar una zona diferente</p>
                </div>
              )}
            </div>
          ) : (
            filteredProperties.map((property) => (
              <Card 
                key={property.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedProperty(property)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Imagen */}
                    <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0">
                      {property.images && property.images[0] ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Información */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {property.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {property.city}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Bed className="h-3 w-3" />
                          {property.bedrooms}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="h-3 w-3" />
                          {property.bathrooms}
                        </span>
                        <span className="flex items-center gap-1">
                          <Square className="h-3 w-3" />
                          {property.area}m²
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-primary">
                          {formatPrice(property.price)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {property.category === 'sale' ? 'Venta' : 'Alquiler'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative overflow-hidden z-0">
        <MapContainer
          center={mapCenter}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Marcadores de propiedades */}
          {filteredProperties.map((property) => (
            <Marker
              key={property.id}
              position={[property.latitude, property.longitude]}
              eventHandlers={{
                click: () => setSelectedProperty(property),
              }}
            >
              <Popup>
                <div className="p-2 max-w-xs">
                  <h3 className="font-semibold text-sm mb-1">
                    {property.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {property.city}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary text-sm">
                      {formatPrice(property.price)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {property.category === 'sale' ? 'Venta' : 'Alquiler'}
                    </Badge>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Herramientas de dibujo */}
          {drawingMode && (
            <DrawingTools
              onDrawCreated={handleDrawCreated}
              onDrawEdited={handleDrawEdited}
              onDrawDeleted={handleDrawDeleted}
            />
          )}
          
          <MapCenter center={mapCenter} />
        </MapContainer>
      </div>
    </div>
  );
}
