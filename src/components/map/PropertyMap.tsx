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
  MousePointer,
  Square as SquareIcon,
  Circle,
  Move,
  Trash2
} from 'lucide-react';
import { FloatingDrawingTools } from './FloatingDrawingTools';
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
  category: 'sale' | 'rent';
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  city: string;
  latitude: number;
  longitude: number;
  images: string[];
}

interface MapSearchProps {
  user?: any;
}

function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
}

// Componente simplificado para las herramientas de dibujo
function SimpleDrawingTools({ onDrawCreated, onDrawEdited, onDrawDeleted, drawingMode, setDrawingMode }: {
  onDrawCreated: (e: any) => void;
  onDrawEdited: (e: any) => void;
  onDrawDeleted: (e: any) => void;
  drawingMode: boolean;
  setDrawingMode: (mode: boolean) => void;
}) {
  const map = useMap();
  const featureGroupRef = useRef<L.FeatureGroup>(null);
  const [currentTool, setCurrentTool] = useState<'rectangle' | 'polygon' | 'circle' | null>(null);

  useEffect(() => {
    if (!featureGroupRef.current) {
      featureGroupRef.current = new L.FeatureGroup();
      map.addLayer(featureGroupRef.current);
    }
  }, [map]);

  const activateTool = (tool: 'rectangle' | 'polygon' | 'circle') => {
    setCurrentTool(tool);
    setDrawingMode(true);
    
    // Limpiar herramientas anteriores
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
    
    // Crear nueva herramienta de dibujo
    const drawControl = new (L as any).Control.Draw({
      position: 'topright',
      draw: {
        rectangle: tool === 'rectangle' ? {
          shapeOptions: {
            color: '#3b82f6',
            weight: 3,
            fillOpacity: 0.2
          }
        } : false,
        polygon: tool === 'polygon' ? {
          shapeOptions: {
            color: '#3b82f6',
            weight: 3,
            fillOpacity: 0.2
          }
        } : false,
        circle: tool === 'circle' ? {
          shapeOptions: {
            color: '#3b82f6',
            weight: 3,
            fillOpacity: 0.2
          }
        } : false,
        marker: false,
        polyline: false,
        circlemarker: false
      },
      edit: {
        featureGroup: featureGroupRef.current,
        remove: true
      }
    });

    map.addControl(drawControl);

    // Eventos
    map.on('draw:created', onDrawCreated);
    map.on('draw:edited', onDrawEdited);
    map.on('draw:deleted', onDrawDeleted);

    // Limpiar control después de dibujar
    const cleanup = () => {
      map.removeControl(drawControl);
      map.off('draw:created', onDrawCreated);
      map.off('draw:edited', onDrawEdited);
      map.off('draw:deleted', onDrawDeleted);
      setCurrentTool(null);
      setDrawingMode(false);
    };

    // Auto-cleanup después de dibujar
    const handleCreated = (e: any) => {
      onDrawCreated(e);
      cleanup();
    };

    map.on('draw:created', handleCreated);

    return () => {
      cleanup();
    };
  };

  const clearDrawing = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
    setCurrentTool(null);
    setDrawingMode(false);
    onDrawDeleted({});
  };

  return (
    <FeatureGroup ref={featureGroupRef}>
      {/* No renderizamos EditControl aquí, lo manejamos manualmente */}
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
        .eq('status', 'active');

      if (error) throw error;

      setProperties(data || []);
      setFilteredProperties(data || []);
    } catch (error) {
      console.error('Error cargando propiedades:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las propiedades",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = properties.filter(property => {
      // Filtro por precio
      if (property.price < filters.priceMin || property.price > filters.priceMax) {
        return false;
      }

      // Filtro por tipo de propiedad
      if (filters.propertyType !== 'all' && property.property_type !== filters.propertyType) {
        return false;
      }

      // Filtro por categoría
      if (filters.category !== 'all' && property.category !== filters.category) {
        return false;
      }

      // Filtro por habitaciones
      if (filters.bedrooms !== 'any' && property.bedrooms < parseInt(filters.bedrooms)) {
        return false;
      }

      // Filtro por área dibujada
      if (drawnArea) {
        try {
          const point = L.latLng(property.latitude, property.longitude);
          
          if (drawnArea.geometry.type === 'Point') {
            // Para círculos
            const center = L.latLng(drawnArea.geometry.coordinates[1], drawnArea.geometry.coordinates[0]);
            const radius = drawnArea.properties.radius;
            const distance = center.distanceTo(point);
            if (distance > radius) {
              return false;
            }
          } else if (drawnArea.geometry.type === 'Polygon') {
            // Para polígonos y rectángulos
            const polygon = L.polygon(drawnArea.geometry.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]));
            if (!polygon.getBounds().contains(point)) {
              return false;
            }
          }
        } catch (error) {
          console.error('Error al filtrar por área:', error);
        }
      }

      return true;
    });

    setFilteredProperties(filtered);
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
    e.layers.eachLayer((layer: any) => {
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

                    {/* Información sobre herramientas de dibujo */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Usa el botón flotante en la esquina superior derecha del mapa para dibujar zonas de búsqueda.
            </p>
          </div>



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
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedProperty?.id === property.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedProperty(property)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Imagen */}
                    <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                      {property.images && property.images.length > 0 ? (
                        <img 
                          src={property.images[0]} 
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
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
          
          <MapCenter center={mapCenter} />
        </MapContainer>

        {/* Herramientas de dibujo flotantes */}
        <FloatingDrawingTools
          onToolSelect={(tool) => {
            if (mapRef.current) {
              const drawControl = new (L as any).Control.Draw({
                position: 'topright',
                draw: {
                  rectangle: tool === 'rectangle' ? {
                    shapeOptions: {
                      color: '#3b82f6',
                      weight: 3,
                      fillOpacity: 0.2
                    }
                  } : false,
                  polygon: tool === 'polygon' ? {
                    shapeOptions: {
                      color: '#3b82f6',
                      weight: 3,
                      fillOpacity: 0.2
                    }
                  } : false,
                  circle: tool === 'circle' ? {
                    shapeOptions: {
                      color: '#3b82f6',
                      weight: 3,
                      fillOpacity: 0.2
                    }
                  } : false,
                  marker: false,
                  polyline: false,
                  circlemarker: false
                },
                edit: false
              });
              
              mapRef.current.addControl(drawControl);
              mapRef.current.on('draw:created', handleDrawCreated);
              setDrawingMode(true);
              
              // Auto-remove después de dibujar
              const cleanup = () => {
                mapRef.current?.removeControl(drawControl);
                mapRef.current?.off('draw:created', handleDrawCreated);
                setDrawingMode(false);
              };
              
              mapRef.current.on('draw:created', cleanup);
            }
          }}
          onClear={() => {
            setDrawnArea(null);
            if (mapRef.current) {
              // Limpiar todos los controles de dibujo
              mapRef.current.eachLayer((layer) => {
                if (layer instanceof L.FeatureGroup) {
                  layer.clearLayers();
                }
              });
            }
            toast({
              title: "Zona eliminada",
              description: "Se ha eliminado la zona dibujada",
            });
          }}
          isDrawing={drawingMode}
          hasDrawnArea={!!drawnArea}
          onClose={() => setDrawingMode(false)}
        />
      </div>
    </div>
  );
}
