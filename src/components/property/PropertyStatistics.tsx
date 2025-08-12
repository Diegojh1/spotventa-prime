import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, Heart, MessageSquare, Phone, TrendingUp, 
  Users, Calendar, BarChart3, Building2, MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PropertyStatisticsProps {
  propertyId: string;
  user?: any;
}

interface PropertyStats {
  total_views: number;
  unique_visitors: number;
  total_favorites: number;
  total_inquiries: number;
  total_comments: number;
  last_viewed_at: string | null;
  engagement_rate: number;
}

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  price: number;
  category: string;
  property_type: string;
  bedrooms: number;
  area_m2: number;
}

export function PropertyStatistics({ propertyId, user }: PropertyStatisticsProps) {
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (propertyId && user) {
      checkOwnership();
      loadProperty();
      loadStatistics();
    }
  }, [propertyId, user]);

  const checkOwnership = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('user_id')
        .eq('id', propertyId)
        .single();

      if (error) throw error;
      setIsOwner(data.user_id === user.id);
    } catch (err) {
      console.error('Error checking ownership:', err);
    }
  };

  const loadProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (error) throw error;
      setProperty(data);
    } catch (err) {
      console.error('Error loading property:', err);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('property_statistics_detailed')
        .select('*')
        .eq('property_id', propertyId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setStats(data);
      } else {
        // Create default stats if none exist
        setStats({
          total_views: 0,
          unique_visitors: 0,
          total_favorites: 0,
          total_inquiries: 0,
          total_comments: 0,
          last_viewed_at: null,
          engagement_rate: 0
        });
      }
    } catch (err) {
      console.error('Error loading statistics:', err);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('es-ES');
  };

  if (!isOwner) {
    return null;
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estadísticas de la Propiedad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Property Info Card */}
      {property && (
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
              {property.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">{property.address}, {property.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{property.bedrooms} hab • {property.area_m2}m²</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-600">{formatPrice(property.price)}€</span>
                <Badge variant={property.category === 'sale' ? 'default' : 'secondary'}>
                  {property.category === 'sale' ? 'Venta' : 'Alquiler'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Views */}
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vistas Totales</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_views || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unique Visitors */}
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Visitantes Únicos</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.unique_visitors || 0}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Favorites */}
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Favoritos</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_favorites || 0}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Rate */}
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Engagement</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.engagement_rate ? `${(stats.engagement_rate * 100).toFixed(1)}%` : '0%'}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Inquiries */}
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 rounded-full">
                <Phone className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Consultas</p>
                <p className="text-xl font-bold text-gray-900">{stats?.total_inquiries || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 rounded-full">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Comentarios</p>
                <p className="text-xl font-bold text-gray-900">{stats?.total_comments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Viewed */}
        <Card className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-50 rounded-full">
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Última Vista</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(stats?.last_viewed_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Resumen de Actividad
            </h3>
            <p className="text-sm text-gray-600">
              Tu propiedad ha generado {stats?.total_favorites || 0} favoritos y {stats?.total_inquiries || 0} consultas.
              {stats?.total_views && stats.total_views > 0 ? 
                ` Ha sido vista ${stats.total_views} veces por ${stats.unique_visitors} visitantes únicos.` : 
                ' Aún no ha recibido visitas.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
