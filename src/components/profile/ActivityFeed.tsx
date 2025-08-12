import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MessageSquare, Heart, Eye, MapPin, ExternalLink, 
  Calendar, User as UserIcon, Building2 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ActivityItem {
  id: string;
  type: 'comment' | 'favorite' | 'view' | 'property_published';
  property_id: string;
  property_title: string;
  property_address: string;
  created_at: string;
  message?: string; // For comments
}

interface ActivityFeedProps {
  user: User | null;
}

export function ActivityFeed({ user }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadActivity();
    }
  }, [user]);

  const loadActivity = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allActivities: ActivityItem[] = [];

      // Load comments
      const { data: commentsData } = await supabase
        .from('property_comments')
        .select(`
          id,
          property_id,
          message,
          created_at,
          properties (
            title,
            address,
            city
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (commentsData) {
        commentsData.forEach(comment => {
          allActivities.push({
            id: comment.id,
            type: 'comment',
            property_id: comment.property_id,
            property_title: comment.properties?.title || 'Propiedad',
            property_address: `${comment.properties?.address}, ${comment.properties?.city}`,
            created_at: comment.created_at,
            message: comment.message
          });
        });
      }

      // Load favorites
      const { data: favoritesData } = await supabase
        .from('property_favorites')
        .select(`
          id,
          property_id,
          created_at,
          properties (
            title,
            address,
            city
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (favoritesData) {
        favoritesData.forEach(favorite => {
          allActivities.push({
            id: favorite.id,
            type: 'favorite',
            property_id: favorite.property_id,
            property_title: favorite.properties?.title || 'Propiedad',
            property_address: `${favorite.properties?.address}, ${favorite.properties?.city}`,
            created_at: favorite.created_at
          });
        });
      }

      // Load property views
      const { data: viewsData } = await supabase
        .from('property_views')
        .select(`
          id,
          property_id,
          viewed_at,
          properties (
            title,
            address,
            city
          )
        `)
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(10);

      if (viewsData) {
        viewsData.forEach(view => {
          allActivities.push({
            id: view.id,
            type: 'view',
            property_id: view.property_id,
            property_title: view.properties?.title || 'Propiedad',
            property_address: `${view.properties?.address}, ${view.properties?.city}`,
            created_at: view.viewed_at
          });
        });
      }

      // Load published properties (for agents)
      const { data: publishedData } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          address,
          city,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (publishedData) {
        publishedData.forEach(property => {
          allActivities.push({
            id: property.id,
            type: 'property_published',
            property_id: property.id,
            property_title: property.title,
            property_address: `${property.address}, ${property.city}`,
            created_at: property.created_at
          });
        });
      }

      // Sort all activities by date
      allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setActivities(allActivities.slice(0, 20)); // Limit to 20 most recent
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'favorite':
        return <Heart className="h-4 w-4" />;
      case 'view':
        return <Eye className="h-4 w-4" />;
      case 'property_published':
        return <Building2 className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'comment':
        return `Comentaste en "${activity.property_title}"`;
      case 'favorite':
        return `Agregaste "${activity.property_title}" a favoritos`;
      case 'view':
        return `Viste "${activity.property_title}"`;
      case 'property_published':
        return `Publicaste "${activity.property_title}"`;
      default:
        return 'Actividad';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'comment':
        return 'bg-blue-100 text-blue-800';
      case 'favorite':
        return 'bg-red-100 text-red-800';
      case 'view':
        return 'bg-green-100 text-green-800';
      case 'property_published':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Hace unos minutos';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <UserIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No hay actividad reciente</h3>
          <p className="text-muted-foreground mb-4">
            Tu actividad aparecerá aquí cuando interactúes con propiedades.
          </p>
          <Button asChild>
            <Link to="/search">
              Explorar propiedades
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card key={activity.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex gap-3">
              {/* Activity Icon */}
              <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {getActivityText(activity)}
                    </p>
                    {activity.message && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        "{activity.message}"
                      </p>
                    )}
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">{activity.property_address}</span>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <Badge variant="outline" className="text-xs">
                      {formatDate(activity.created_at)}
                    </Badge>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/property/${activity.property_id}`}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver propiedad
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
