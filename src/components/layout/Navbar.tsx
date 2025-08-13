import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  NavigationMenu, 
  NavigationMenuContent, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuList, 
  NavigationMenuTrigger 
} from '@/components/ui/navigation-menu';
import { 
  User, LogOut, Building2, Heart, MessageSquare, 
  Bell, ChevronDown, Search, MapPin, Menu, Crown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/use-profile';
// import { Database } from '@/integrations/supabase/types';

type Notification = {
  id: string;
  type: 'favorite' | 'inquiry' | 'comment' | 'message';
  message: string;
  created_at: string;
  is_read: boolean;
  properties: {
    title: string;
    address: string;
  } | null;
  user_profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

interface NavbarProps {
  user?: any;
}

export function Navbar({ user }: NavbarProps) {
  const { profile } = useProfile(user);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Set up real-time subscription for new notifications
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'property_favorites' 
          }, 
          () => {
            loadNotifications();
          }
        )
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'property_inquiries' 
          }, 
          () => {
            loadNotifications();
          }
        )
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'property_comments' 
          }, 
          () => {
            loadNotifications();
          }
        )
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'property_comment_replies' 
          }, 
          () => {
            loadNotifications();
          }
        )
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'direct_messages' 
          }, 
          () => {
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      // Load favorites notifications
      const { data: favorites, error: favoritesError } = await supabase
        .from('property_favorites')
        .select(`
          id,
          user_id,
          created_at,
          is_read,
          properties (
            title,
            address
          )
        `)
        .eq('properties.user_id', user.id)
        .neq('user_id', user.id) // Exclude user's own actions
        .order('created_at', { ascending: false })
        .limit(5);

      if (favoritesError) throw favoritesError;

      // Load inquiries notifications
      const { data: inquiries, error: inquiriesError } = await supabase
        .from('property_inquiries')
        .select(`
          id,
          user_id,
          created_at,
          is_read,
          properties (
            title,
            address
          )
        `)
        .eq('properties.user_id', user.id)
        .neq('user_id', user.id) // Exclude user's own actions
        .order('created_at', { ascending: false })
        .limit(5);

      if (inquiriesError) throw inquiriesError;

      // Load comment replies notifications
      const { data: commentReplies, error: repliesError } = await supabase
        .from('property_comment_replies')
        .select(`
          id,
          user_id,
          created_at,
          is_read,
          property_comments!inner (
            property_id,
            properties!inner (
              title,
              address
            )
          )
        `)
        .eq('property_comments.user_id', user.id)
        .neq('user_id', user.id) // Exclude user's own replies
        .order('created_at', { ascending: false })
        .limit(5);

      if (repliesError) throw repliesError;

      // Load direct messages notifications
      const { data: directMessages, error: messagesError } = await supabase
        .from('direct_messages')
        .select(`
          id,
          sender_id,
          created_at,
          is_read,
          properties (
            title,
            address
          )
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (messagesError) throw messagesError;

      // Get user profiles for all notifications
      const userIds = [
        ...(favorites || []).map(fav => fav.user_id),
        ...(inquiries || []).map(inq => inq.user_id),
        ...(commentReplies || []).map(reply => reply.user_id),
        ...(directMessages || []).map(msg => msg.sender_id)
      ];

      const { data: userProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map();
      userProfiles?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Combine all notifications
      const allNotifications = [
        ...(favorites || []).map(fav => ({
          id: fav.id,
          type: 'favorite' as const,
          message: `${profilesMap.get(fav.user_id)?.full_name || 'Usuario'} agregó tu propiedad a favoritos`,
          created_at: fav.created_at,
          is_read: fav.is_read,
          properties: fav.properties,
          user_profiles: profilesMap.get(fav.user_id) || null
        })),
        ...(inquiries || []).map(inq => ({
          id: inq.id,
          type: 'inquiry' as const,
          message: `${profilesMap.get(inq.user_id)?.full_name || 'Usuario'} envió una consulta sobre tu propiedad`,
          created_at: inq.created_at,
          is_read: inq.is_read,
          properties: inq.properties,
          user_profiles: profilesMap.get(inq.user_id) || null
        })),
        ...(commentReplies || []).map(reply => ({
          id: reply.id,
          type: 'comment' as const,
          message: `${profilesMap.get(reply.user_id)?.full_name || 'Usuario'} respondió a tu comentario`,
          created_at: reply.created_at,
          is_read: reply.is_read,
          properties: reply.property_comments.properties,
          user_profiles: profilesMap.get(reply.user_id) || null
        })),
        ...(directMessages || []).map(msg => ({
          id: msg.id,
          type: 'message' as const,
          message: `${profilesMap.get(msg.sender_id)?.full_name || 'Usuario'} te envió un mensaje privado`,
          created_at: msg.created_at,
          is_read: msg.is_read,
          properties: msg.properties,
          user_profiles: profilesMap.get(msg.sender_id) || null
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      // Mark all current notifications as read in the database
      const notificationIds = notifications.map(n => n.id);
      
      // Group notifications by type
      const favorites = notifications.filter(n => n.type === 'favorite').map(n => n.id);
      const inquiries = notifications.filter(n => n.type === 'inquiry').map(n => n.id);
      const comments = notifications.filter(n => n.type === 'comment').map(n => n.id);
      const messages = notifications.filter(n => n.type === 'message').map(n => n.id);

      // Call the database function to mark notifications as read
      if (favorites.length > 0) {
        await supabase.rpc('mark_notifications_as_read', {
          notification_ids: favorites,
          notification_type: 'favorite'
        });
      }

      if (inquiries.length > 0) {
        await supabase.rpc('mark_notifications_as_read', {
          notification_ids: inquiries,
          notification_type: 'inquiry'
        });
      }

      if (comments.length > 0) {
        await supabase.rpc('mark_notifications_as_read', {
          notification_ids: comments,
          notification_type: 'comment'
        });
      }

      if (messages.length > 0) {
        await supabase.rpc('mark_notifications_as_read', {
          notification_ids: messages,
          notification_type: 'message'
        });
      }

      // Update frontend state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Hace unos minutos';
    } else if (diffInHours < 24) {
      return `Hace ${Math.floor(diffInHours)} horas`;
    } else {
      return date.toLocaleDateString('es-ES');
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/LogoSolo.png" alt="SpotVenta" className="h-8 w-8" />
            <span className="text-xl font-bold text-black">SpotVenta</span>
          </Link>

          {/* Navigation Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/">
                    <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                      Home
                    </Button>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-gray-700 hover:text-gray-900">
                    Comprar
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="p-4 w-48">
                      <div className="space-y-2">
                        <Link to="/search?category=sale&property_type=all" className="block text-sm text-gray-700 hover:text-gray-900">
                          Casas
                        </Link>
                        <Link to="/search?category=sale&property_type=Apartamento" className="block text-sm text-gray-700 hover:text-gray-900">
                          Apartamentos
                        </Link>
                        <Link to="/search?category=sale&property_type=Estudio" className="block text-sm text-gray-700 hover:text-gray-900">
                          Estudios
                        </Link>
                        <Link to="/search?category=sale&property_type=Oficina" className="block text-sm text-gray-700 hover:text-gray-900">
                          Oficinas
                        </Link>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-gray-700 hover:text-gray-900">
                    Alquilar
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="p-4 w-48">
                      <div className="space-y-2">
                        <Link to="/search?category=rent&property_type=all" className="block text-sm text-gray-700 hover:text-gray-900">
                          Casas
                        </Link>
                        <Link to="/search?category=rent&property_type=Apartamento" className="block text-sm text-gray-700 hover:text-gray-900">
                          Apartamentos
                        </Link>
                        <Link to="/search?category=rent&property_type=Estudio" className="block text-sm text-gray-700 hover:text-gray-900">
                          Estudios
                        </Link>
                        <Link to="/search?category=rent&property_type=Oficina" className="block text-sm text-gray-700 hover:text-gray-900">
                          Oficinas
                        </Link>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/map">
                    <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                      <MapPin className="h-4 w-4 mr-2" />
                      Buscar por zona
                    </Button>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <DropdownMenu onOpenChange={(open) => {
                  if (open) {
                    markNotificationsAsRead();
                  }
                }}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel className="flex items-center justify-between">
                      <span>Notificaciones</span>
                      {unreadCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {unreadCount} nuevas
                        </Badge>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tienes notificaciones</p>
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.map((notification) => (
                          <DropdownMenuItem key={notification.id} className="p-3">
                            <div className="flex items-start gap-3 w-full">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={notification.user_profiles?.avatar_url} />
                                <AvatarFallback>
                                  {notification.user_profiles?.full_name?.charAt(0) || <User className="h-4 w-4" />}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {notification.properties?.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(notification.created_at)}
                                </p>
                              </div>
                              <Badge variant={notification.type === 'favorite' ? 'default' : notification.type === 'message' ? 'secondary' : 'outline'} className="text-xs">
                                {notification.type === 'favorite' ? 'Favorito' : 
                                 notification.type === 'inquiry' ? 'Consulta' :
                                 notification.type === 'comment' ? 'Respuesta' : 'Mensaje'}
                              </Badge>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=notifications" className="w-full">
                        Ver todas las notificaciones
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:block text-sm font-medium">
                        {profile?.full_name || 'Usuario'}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profile?.full_name || 'Usuario'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Mi Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=messages" className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Mensajes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=properties" className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2" />
                        Mis Propiedades
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/subscription" className="flex items-center">
                        <Crown className="h-4 w-4 mr-2" />
                        Planes y Suscripciones
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Publicar Button */}
                {profile?.user_type === 'agent' && (
                  <Button asChild className="bg-black hover:bg-gray-800">
                    <Link to="/publish">
                      <Building2 className="h-4 w-4 mr-2" />
                      Publicar
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Iniciar Sesión</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth">Registrarse</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}