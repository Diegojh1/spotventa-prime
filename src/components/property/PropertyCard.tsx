import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Bed, Bath, Square, Phone, Mail } from 'lucide-react';
import { Property } from '@/types/property';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PropertyInquiry } from './PropertyInquiry';

interface PropertyCardProps {
  property: Property;
  user?: any;
  isFavorite?: boolean;
  onFavoriteChange?: (propertyId: string, isFavorite: boolean) => void;
}

export function PropertyCard({ property, user, isFavorite = false, onFavoriteChange }: PropertyCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const { toast } = useToast();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
        const { error } = await supabase
          .from('property_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', property.id);

        if (error) throw error;
        onFavoriteChange?.(property.id, false);
      } else {
        const { error } = await supabase
          .from('property_favorites')
          .insert({
            user_id: user.id,
            property_id: property.id
          });

        if (error) throw error;
        onFavoriteChange?.(property.id, true);
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

  const mainImage = Array.isArray(property.images) && property.images.length > 0 
    ? property.images[0] 
    : '/placeholder.svg';

  return (
    <Card className="group hover:shadow-card-hover transition-all duration-300 border-0 shadow-card overflow-hidden">
      <Link to={`/property/${property.id}`}>
        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={mainImage}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge 
              variant={property.category === 'sale' ? 'default' : 'secondary'}
              className="bg-background/90 text-foreground"
            >
              {property.category === 'sale' ? 'Venta' : 'Alquiler'}
            </Badge>
            {property.is_featured && (
              <Badge className="bg-accent-pink text-accent-pink-foreground">
                Destacado
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8 bg-background/90 hover:bg-background"
            onClick={toggleFavorite}
            disabled={isToggling}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                isFavorite ? "fill-accent-pink text-accent-pink" : "text-muted-foreground"
              )}
            />
          </Button>

          {/* Price */}
          <div className="absolute bottom-3 left-3">
            <div className="bg-background/95 rounded-lg px-3 py-2">
              <p className="text-lg font-bold text-primary">
                {formatPrice(property.price)}
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {property.title}
              </h3>
              <div className="flex items-center text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{property.city}, {property.country}</span>
              </div>
            </div>

            {/* Property Details */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-4">
                {property.bedrooms > 0 && (
                  <div className="flex items-center">
                    <Bed className="h-4 w-4 mr-1" />
                    <span>{property.bedrooms}</span>
                  </div>
                )}
                {property.bathrooms > 0 && (
                  <div className="flex items-center">
                    <Bath className="h-4 w-4 mr-1" />
                    <span>{property.bathrooms}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Square className="h-4 w-4 mr-1" />
                  <span>{property.area_m2} m²</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            {(property.contact_name || property.contact_phone) && (
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="text-sm">
                  {property.contact_name && (
                    <p className="font-medium">{property.contact_name}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {property.contact_phone && (
                    <Button variant="outline" size="sm" onClick={(e) => e.preventDefault()}>
                      <Phone className="h-3 w-3" />
                    </Button>
                  )}
                  {property.contact_email && (
                    <Button variant="outline" size="sm" onClick={(e) => e.preventDefault()}>
                      <Mail className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Inquiry Button */}
            {user && (
              <div className="pt-2">
                <PropertyInquiry 
                  propertyId={property.id} 
                  propertyTitle={property.title}
                  user={user}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}