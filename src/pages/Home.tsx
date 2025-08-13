import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SearchBar from '@/components/search/SearchBar';
import { 
  Search, MapPin, Building2, ChevronDown, Smartphone, TrendingUp, ArrowRight, Star, Shield, Zap,
  Clock, Eye
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
// import { Database } from '@/integrations/supabase/types';

type Property = {
  id: string;
  title: string;
  address: string;
  city: string;
  price: number;
  category: string;
  property_type: string;
  bedrooms: number;
  area_m2: number;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images?: string[];
};

export function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para la barra de búsqueda (ya no necesario con el nuevo SearchBar)

  useEffect(() => {
    // Obtener el usuario actual
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchRecentProperties = async () => {
      try {
        setLoading(true);
        
        if (!user) {
          // Si no hay usuario, limpiar las propiedades recientes
          setRecentProperties([]);
          return;
        }

        // Si hay usuario, obtener propiedades que ha visto recientemente
        console.log('Fetching recent views for user:', user.id);
        const { data: recentViews, error: viewsError } = await supabase
          .from('property_views')
          .select(`
            property_id,
            viewed_at,
            properties (*)
          `)
          .eq('user_id', user.id)
          .order('viewed_at', { ascending: false })
          .limit(6);

        if (viewsError) throw viewsError;

        console.log('Recent views found:', recentViews);

        if (recentViews && recentViews.length > 0) {
          // Extraer las propiedades de las vistas recientes
          const properties = recentViews
            .map(view => view.properties)
            .filter(property => property && property.is_active) as Property[];
          
          console.log('Filtered properties:', properties);
          setRecentProperties(properties);
        } else {
          // Si no hay vistas recientes, no mostrar nada
          console.log('No recent views found');
          setRecentProperties([]);
        }
      } catch (err) {
        setError('Failed to fetch recent properties');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentProperties();
    const interval = setInterval(fetchRecentProperties, 30000); // Fetch every 30 seconds
    return () => clearInterval(interval);
  }, [user]);



  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Background Image */}
      <div className="relative h-[600px] bg-cover bg-center" style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')"
      }}>
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
          <div className="text-center space-y-8">
                        {/* Main Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-8">
              Haz caso a tu intuición
            </h1>
            
            {/* Nueva barra de búsqueda expandible */}
            <SearchBar variant="hero" />
          </div>
        </div>
      </div>

      {/* Recent Properties Section */}
      {user && recentProperties.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Tus últimas vistas
            </h2>
            <p className="text-gray-600">
              Las últimas propiedades que has visitado recientemente
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProperties.map((property) => (
              <Card key={property.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={Array.isArray(property.images) && property.images.length > 0 
                      ? property.images[0] as string 
                      : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop'
                    }
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-sm font-semibold text-gray-900">
                      {property.category === 'sale' ? 'Venta' : 'Alquiler'}
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
                    {property.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {property.address}, {property.city}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {property.bedrooms}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {property.area_m2}m²
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {property.price.toLocaleString('es-ES')}€
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Vista recientemente
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/property/${property.id}`)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Ver detalles
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              onClick={() => navigate('/search')}
              className="text-blue-600 hover:text-blue-700"
            >
              Ver todas las propiedades
            </Button>
          </div>
        </div>
      )}

      {/* Feature Cards Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Herramientas inteligentes para tu búsqueda
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descubre las mejores propiedades con nuestras herramientas avanzadas de búsqueda
          </p>
        </div>
        
        <div className="space-y-8">
          {/* Draw Search Area Card - Horizontal */}
          <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 bg-white">
            <div className="flex flex-col lg:flex-row items-center">
              {/* Image - Left side */}
              <div className="relative w-full lg:w-1/2 h-80 lg:h-96 overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300">
                <img 
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                  alt="Búsqueda en mapa de España"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 via-blue-600/20 to-transparent"></div>
                {/* Mapa de España overlay */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-3 shadow-lg">
                  <div className="text-xs font-bold text-blue-900">ESPAÑA</div>
                  <div className="text-xs text-blue-700">Mapa interactivo</div>
                </div>
                {/* Zona dibujada overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 border-4 border-blue-500 border-dashed bg-blue-500/20 flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>
              
              {/* Content - Right side */}
              <div className="w-full lg:w-1/2 p-8 lg:p-12">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">
                      Búsqueda por zona
                    </h3>
                    <p className="text-blue-600 font-medium">Mapa interactivo</p>
                  </div>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Dibuja exactamente la zona que te interesa en nuestro mapa de España. 
                    Encuentra propiedades en barrios específicos con precisión milimétrica.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>Selección por polígono personalizado</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>Filtros por radio de distancia</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>Vista satélite y callejero</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>Búsqueda por coordenadas</span>
                    </div>
                  </div>
                  <Link 
                    to="/map" 
                    className="inline-flex items-center gap-3 text-blue-600 hover:text-blue-700 font-semibold text-lg group/link"
                  >
                    Explorar mapa
                    <ArrowRight className="h-5 w-5 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* Publish Property Card - Horizontal */}
          <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 bg-white">
            <div className="flex flex-col lg:flex-row-reverse items-center">
              {/* Image - Right side */}
              <div className="relative w-full lg:w-1/2 h-80 lg:h-96 overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300">
                <img 
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                  alt="Publicar inmueble"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 via-emerald-600/20 to-transparent"></div>
                {/* Badge de "Gratis" */}
                <div className="absolute top-4 right-4 bg-emerald-600 text-white px-4 py-2 font-bold text-sm shadow-lg">
                  GRATIS
                </div>
              </div>
              
              {/* Content - Left side */}
              <div className="w-full lg:w-1/2 p-8 lg:p-12">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">
                      Publica tu inmueble
                    </h3>
                    <p className="text-emerald-600 font-medium">Sin costos ocultos</p>
                  </div>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Tus primeros 2 anuncios son completamente gratis. 
                    Llega a miles de compradores interesados en tu zona.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>Fotografías profesionales incluidas</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>Estadísticas detalladas de visitas</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>Soporte prioritario para vendedores</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>Publicación en tiempo real</span>
                    </div>
                  </div>
                  <Link 
                    to="/auth" 
                    className="inline-flex items-center gap-3 text-emerald-600 hover:text-emerald-700 font-semibold text-lg group/link"
                  >
                    Empezar a vender
                    <TrendingUp className="h-5 w-5 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <div className="text-white space-y-8">
              <div className="space-y-4">
                <h2 className="text-5xl font-bold leading-tight">
                  Lleva SpotVenta siempre contigo
                </h2>
                <p className="text-xl text-white/90 leading-relaxed">
                  Descarga nuestra app y encuentra tu hogar ideal desde cualquier lugar. 
                  Búsquedas avanzadas, notificaciones instantáneas y herramientas exclusivas.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white/90">
                  <Shield className="h-5 w-5 text-green-400" />
                  <span>Búsquedas seguras y verificadas</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  <span>Notificaciones en tiempo real</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <Star className="h-5 w-5 text-blue-400" />
                  <span>Favoritos sincronizados</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-lg">
                  <Smartphone className="h-6 w-6 mr-3" />
                  Descargar App
                </Button>
              </div>
            </div>

            {/* Right: App Mockup */}
            <div className="relative">
              <div className="aspect-[3/4] overflow-hidden shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                  alt="App móvil"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                {/* App Store Badges */}
                <div className="absolute bottom-6 left-6 right-6 flex gap-3">
                  <div className="bg-black/80 backdrop-blur-sm p-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-white"></div>
                    <div className="text-white text-xs">
                      <div className="font-bold">App Store</div>
                      <div className="text-white/70">Disponible</div>
                    </div>
                  </div>
                  <div className="bg-black/80 backdrop-blur-sm p-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-white"></div>
                    <div className="text-white text-xs">
                      <div className="font-bold">Google Play</div>
                      <div className="text-white/70">Disponible</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}