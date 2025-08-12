import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Calendar,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  title: string;
  price: number;
  property_type: string;
  category: string;
  city: string;
  is_active: boolean;
  created_at: string;
  images: any;
}

interface MyPropertiesProps {
  user: User;
}

export function MyProperties({ user }: MyPropertiesProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadProperties();
    }
  }, [user]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (propertiesError) {
        console.error('Error loading properties:', propertiesError);
        toast({
          title: "Error",
          description: "No se pudieron cargar las propiedades",
          variant: "destructive"
        });
        return;
      }

      setProperties(propertiesData || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePropertyStatus = async (propertyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_active: !currentStatus })
        .eq('id', propertyId);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado de la propiedad",
          variant: "destructive"
        });
        return;
      }

      // Actualizar el estado local
      setProperties(prev => prev.map(property => 
        property.id === propertyId 
          ? { ...property, is_active: !currentStatus }
          : property
      ));

      toast({
        title: "Estado actualizado",
        description: `Propiedad ${!currentStatus ? 'activada' : 'desactivada'} correctamente`
      });
    } catch (error) {
      console.error('Error toggling property status:', error);
    }
  };

  const deleteProperty = async (propertyId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta propiedad? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar la propiedad",
          variant: "destructive"
        });
        return;
      }

      // Actualizar el estado local
      setProperties(prev => prev.filter(property => property.id !== propertyId));

      toast({
        title: "Propiedad eliminada",
        description: "La propiedad se ha eliminado correctamente"
      });
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No tienes propiedades publicadas</h3>
        <p className="text-muted-foreground mb-6">
          Comienza a publicar propiedades para verlas aquí.
        </p>
        <Button asChild>
          <Link to="/publish">
            <Plus className="h-4 w-4 mr-2" />
            Publicar Primera Propiedad
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Mis Propiedades ({properties.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {properties.filter(p => p.is_active).length}
              </div>
              <div className="text-sm text-muted-foreground">Activas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {properties.filter(p => !p.is_active).length}
              </div>
              <div className="text-sm text-muted-foreground">Inactivas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {properties.length}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de propiedades */}
      <div className="space-y-4">
        {properties.map((property) => (
          <Card key={property.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{property.title}</CardTitle>
                    <Badge variant={property.is_active ? "default" : "secondary"}>
                      {property.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {property.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(property.created_at)}
                    </span>
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">
                    {formatPrice(property.price)}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {property.property_type} • {property.category}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Imagen principal */}
              {property.images && Array.isArray(property.images) && property.images.length > 0 && (
                <div className="mb-4">
                  <img
                    src={String(property.images[0])}
                    alt={property.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/property/${property.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/edit-property/${property.id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => togglePropertyStatus(property.id, property.is_active)}
                >
                  {property.is_active ? "Desactivar" : "Activar"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deleteProperty(property.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
