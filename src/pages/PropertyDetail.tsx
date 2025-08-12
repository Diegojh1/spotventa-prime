import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Heart, Share2, Phone, Mail, MapPin, Bed, Bath, Square, 
  Car, Calendar, Zap, ChevronLeft, ChevronRight, 
  ArrowLeft, Eye, Star, MessageSquare
} from 'lucide-react';
import { Property } from '@/types/property';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PropertyComments } from '@/components/property/PropertyComments';

import { DirectChat } from '@/components/property/DirectChat';

interface PropertyDetailProps {
  user?: any;
}

export function PropertyDetail({ user }: PropertyDetailProps) {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isToggling, setIsToggling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadProperty();
      updateViews();
      if (user) {
        checkFavorite();
      }
    }
  }, [id, user]);

  const loadProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProperty(data);
    } catch (error) {
      console.error('Error loading property:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateViews = async () => {
    if (!id) return;
    
    try {
      // Increment views count manually since RPC function doesn't exist yet
      const { data: currentProperty } = await supabase
        .from('properties')
        .select('views_count')
        .eq('id', id)
        .single();
      
      if (currentProperty) {
        await supabase
          .from('properties')
          .update({ views_count: (currentProperty.views_count || 0) + 1 })
          .eq('id', id);
      }

      // Register view in property_views table if user is logged in
      if (user) {
        console.log('Registering view for user:', user.id, 'property:', id);
        const { data, error } = await supabase
          .from('property_views')
          .upsert({
            user_id: user.id,
            property_id: id,
            viewed_at: new Date().toISOString()
          }, {
            onConflict: 'property_id,user_id'
          });
        
        if (error) {
          console.error('Error registering view:', error);
        } else {
          console.log('View registered successfully:', data);
        }
      }
    } catch (error) {
      console.error('Error updating views:', error);
    }
  };

  const checkFavorite = async () => {
    if (!user || !id) return;
    
    const { data } = await supabase
      .from('property_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('property_id', id)
      .single();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para guardar favoritos",
        variant: "destructive"
      });
      return;
    }

    setIsToggling(true);

    try {
      if (isFavorite) {
        await supabase
          .from('property_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', id);
        setIsFavorite(false);
        toast({ title: "Eliminado de favoritos" });
      } else {
        await supabase
          .from('property_favorites')
          .insert({
            user_id: user.id,
            property_id: id
          });
        setIsFavorite(true);
        toast({ title: "Añadido a favoritos" });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar los favoritos",
        variant: "destructive"
      });
    } finally {
      setIsToggling(false);
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

  const shareProperty = async () => {
    if (navigator.share) {
      await navigator.share({
        title: property?.title,
        text: `Mira esta propiedad en SpotVenta`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Enlace copiado al portapapeles" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full mb-8 rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Propiedad no encontrada
          </h1>
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  const images = Array.isArray(property.images) ? property.images : [];
  const features = Array.isArray(property.features) ? property.features : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Back Navigation */}
      <div className="bg-muted/30 py-4">
        <div className="max-w-6xl mx-auto px-4">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/search">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a resultados
            </Link>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Image Gallery */}
        <div className="mb-8">
          {images.length > 0 ? (
            <div className="relative">
              <div className="aspect-[16/9] overflow-hidden rounded-lg">
                <img
                  src={images[currentImageIndex]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {images.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/80"
                    onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/80"
                    onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/80 rounded-full px-3 py-1">
                    <span className="text-sm text-foreground">
                      {currentImageIndex + 1} / {images.length}
                    </span>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-background/80"
                  onClick={shareProperty}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-background/80"
                  onClick={toggleFavorite}
                  disabled={isToggling}
                >
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      isFavorite ? "fill-accent-pink text-accent-pink" : "text-muted-foreground"
                    )}
                  />
                </Button>
              </div>
            </div>
          ) : (
            <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Sin imágenes disponibles</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {property.title}
                  </h1>
                  <div className="flex items-center text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{property.address}, {property.city}, {property.country}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {formatPrice(property.price)}
                  </div>
                  <Badge variant={property.category === 'sale' ? 'default' : 'secondary'}>
                    {property.category === 'sale' ? 'Venta' : 'Alquiler'}
                  </Badge>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {property.bedrooms > 0 && (
                  <div className="flex items-center">
                    <Bed className="h-4 w-4 mr-1" />
                    <span>{property.bedrooms} hab.</span>
                  </div>
                )}
                {property.bathrooms > 0 && (
                  <div className="flex items-center">
                    <Bath className="h-4 w-4 mr-1" />
                    <span>{property.bathrooms} baños</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Square className="h-4 w-4 mr-1" />
                  <span>{property.area_m2} m²</span>
                </div>
                {property.parking_spaces && property.parking_spaces > 0 && (
                  <div className="flex items-center">
                    <Car className="h-4 w-4 mr-1" />
                    <span>{property.parking_spaces} plazas</span>
                  </div>
                )}
                {property.views_count && (
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    <span>{property.views_count} vistas</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Description */}
            {property.description && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Descripción
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {property.description}
                </p>
              </div>
            )}

            {/* Features */}
            {features.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Características
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center p-3 bg-muted rounded-lg">
                      <Star className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Property Details */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Detalles de la propiedad
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-medium">{property.property_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Superficie:</span>
                    <span className="font-medium">{property.area_m2} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Habitaciones:</span>
                    <span className="font-medium">{property.bedrooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Baños:</span>
                    <span className="font-medium">{property.bathrooms}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {property.year_built && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Año construcción:</span>
                      <span className="font-medium">{property.year_built}</span>
                    </div>
                  )}
                  {property.parking_spaces && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plazas de garaje:</span>
                      <span className="font-medium">{property.parking_spaces}</span>
                    </div>
                  )}
                  {property.energy_rating && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Certificado energético:</span>
                      <span className="font-medium">{property.energy_rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle>Contactar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.contact_name && (
                  <div>
                    <p className="font-medium text-foreground">{property.contact_name}</p>
                    {property.user_id && (
                      <p className="text-sm text-muted-foreground">Agente verificado</p>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  {property.contact_phone && (
                    <Button className="w-full" asChild>
                      <a href={`tel:${property.contact_phone}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Llamar
                      </a>
                    </Button>
                  )}
                  {property.contact_email && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={`mailto:${property.contact_email}`}>
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </a>
                    </Button>
                  )}
                  {user && user.id !== property.user_id && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        // Scroll to chat section
                        document.getElementById('direct-chat')?.scrollIntoView({ 
                          behavior: 'smooth' 
                        });
                      }}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Chatear con vendedor
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Price per m² */}
            <Card>
              <CardHeader>
                <CardTitle>Información de precio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precio total:</span>
                    <span className="font-bold">{formatPrice(property.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precio por m²:</span>
                    <span className="font-medium">
                      {formatPrice(Math.round(property.price / property.area_m2))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Chat */}
            <div id="direct-chat">
              <DirectChat propertyId={id!} user={user} />
            </div>
          </div>
        </div>

        {/* Comments Section */}
               <div className="mt-12 space-y-6">
         <PropertyComments propertyId={id!} user={user} />
       </div>
      </div>
    </div>
  );
}