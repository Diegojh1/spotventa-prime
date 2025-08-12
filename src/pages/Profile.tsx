import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, Edit, Building2, Heart, MessageSquare, 
  Bell, BarChart3, Activity, Settings, LogOut,
  Eye, TrendingUp, Users, Calendar, Phone, Mail
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/use-profile';
// import { Database } from '@/integrations/supabase/types';
import { PropertyStatistics } from '@/components/property/PropertyStatistics';
import { DirectChat } from '@/components/property/DirectChat';
import { CommentReplies } from '@/components/property/CommentReplies';
import { EditProfileModal } from '@/components/profile/EditProfileModal';

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
type PropertyComment = {
  id: string;
  property_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  properties: {
    title: string;
    address: string;
    city: string;
  } | null;
};
type MessageThread = {
  id: string;
  property_id: string;
  buyer_id: string;
  seller_id: string;
  chat_id?: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  properties: {
    title: string;
    address: string;
    city: string;
  } | null;
  buyer_profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  seller_profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

interface ProfileProps {
  user?: any;
}

export function Profile({ user }: ProfileProps) {
  const { profile, loading, updateProfile } = useProfile(user);
  const [activeTab, setActiveTab] = useState('profile');
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [selectedPropertyForStats, setSelectedPropertyForStats] = useState<string | null>(null);
  const [comments, setComments] = useState<PropertyComment[]>([]);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadMyProperties();
      loadComments();
      loadMessageThreads();
      loadNotifications();
    }
  }, [user]);

  const loadMyProperties = async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyProperties(data || []);
    } catch (err) {
      console.error('Error loading properties:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const loadComments = async () => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('property_comments')
        .select(`
          *,
          properties (
            title,
            address,
            city
          )
        `)
        .eq('properties.user_id', user.id)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });

        const formattedComments = commentsData.map(comment => ({
          ...comment,
          profiles: profilesMap.get(comment.user_id) || null
        }));

        setComments(formattedComments);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const loadMessageThreads = async () => {
    try {
      // Get threads where user is either buyer or seller
      const { data, error } = await supabase
        .from('message_threads')
        .select(`
          *,
          properties (
            title,
            address,
            city
          )
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Get profiles for both buyers and sellers
        const buyerIds = [...new Set(data.map(thread => thread.buyer_id))];
        const sellerIds = [...new Set(data.map(thread => thread.seller_id))];
        const allUserIds = [...new Set([...buyerIds, ...sellerIds])];

        const { data: userProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', allUserIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map();
        userProfiles?.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });

        const formattedThreads = data.map(thread => ({
          ...thread,
          buyer_profiles: profilesMap.get(thread.buyer_id) || null,
          seller_profiles: profilesMap.get(thread.seller_id) || null
        }));

        setMessageThreads(formattedThreads);
      } else {
        setMessageThreads([]);
      }
    } catch (err) {
      console.error('Error loading message threads:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      // Get favorites
      const { data: favorites, error: favoritesError } = await supabase
        .from('property_favorites')
        .select(`
          *,
          properties (
            title,
            address,
            city
          )
        `)
        .eq('properties.user_id', user.id)
        .order('created_at', { ascending: false });

      if (favoritesError) throw favoritesError;

      // Get inquiries
      const { data: inquiries, error: inquiriesError } = await supabase
        .from('property_inquiries')
        .select(`
          *,
          properties (
            title,
            address,
            city
          )
        `)
        .eq('properties.user_id', user.id)
        .order('created_at', { ascending: false });

      if (inquiriesError) throw inquiriesError;

      // Get user profiles for favorites and inquiries
      const userIds = [
        ...(favorites || []).map(fav => fav.user_id),
        ...(inquiries || []).map(inq => inq.user_id)
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

      // Combine and format notifications
      const allNotifications = [
        ...(favorites || []).map(fav => ({
          ...fav,
          type: 'favorite',
          message: `${profilesMap.get(fav.user_id)?.full_name || 'Usuario'} agregó tu propiedad a favoritos`,
          user_profiles: profilesMap.get(fav.user_id) || null
        })),
        ...(inquiries || []).map(inq => ({
          ...inq,
          type: 'inquiry',
          message: `${profilesMap.get(inq.user_id)?.full_name || 'Usuario'} envió una consulta sobre tu propiedad`,
          user_profiles: profilesMap.get(inq.user_id) || null
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente"
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    // Actualizar el estado local del perfil
    if (profile) {
      updateProfile({
        ...profile,
        avatar_url: newAvatarUrl || null
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Error: No se pudo cargar el perfil</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estadísticas
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Mensajes
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Mis Propiedades
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{profile?.full_name || 'Usuario'}</h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Miembro desde {new Date(user?.created_at).toLocaleDateString('es-ES')}
                  </p>
                  
                  {profile?.phone && (
                    <p className="text-sm text-muted-foreground">
                      📞 {profile.phone}
                    </p>
                  )}
                  
                  {profile?.bio && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {profile.bio}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="outline" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab - Only for Agents */}
        {profile?.user_type === 'agent' && (
          <TabsContent value="statistics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Estadísticas de Propiedades
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Analiza el rendimiento de tus propiedades publicadas
                </p>
              </CardHeader>
              <CardContent>
                {myProperties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tienes propiedades publicadas</p>
                    <p className="text-sm">Publica tu primera propiedad para ver estadísticas</p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <label className="text-sm font-medium">Seleccionar Propiedad:</label>
                      <select
                        value={selectedPropertyForStats || ''}
                        onChange={(e) => setSelectedPropertyForStats(e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Selecciona una propiedad</option>
                        {myProperties.map((property) => (
                          <option key={property.id} value={property.id}>
                            {property.title} - {property.address}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myProperties.map((property) => (
                        <Card 
                          key={property.id} 
                          className={`cursor-pointer hover:shadow-md transition-shadow ${
                            selectedPropertyForStats === property.id ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => setSelectedPropertyForStats(property.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-sm truncate">{property.title}</h3>
                              <Badge variant={property.category === 'sale' ? 'default' : 'secondary'}>
                                {property.category === 'sale' ? 'Venta' : 'Alquiler'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mb-2">
                              {property.address}, {property.city}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {property.price.toLocaleString('es-ES')}€
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {property.bedrooms} hab • {property.area_m2}m²
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {selectedPropertyForStats && (
                      <div className="mt-6">
                        <Separator className="my-4" />
                        <PropertyStatistics propertyId={selectedPropertyForStats} user={user} />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Mensajes Privados
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {profile?.user_type === 'agent' 
                  ? 'Conversaciones con compradores interesados en tus propiedades'
                  : 'Conversaciones con vendedores sobre propiedades de interés'
                }
              </p>
            </CardHeader>
            <CardContent>
              {messageThreads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes mensajes privados</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
                  {/* Threads List */}
                  <div className="lg:col-span-1 border rounded-lg p-4 space-y-3 overflow-y-auto">
                    <h3 className="font-semibold mb-3">Conversaciones</h3>
                    {messageThreads.map((thread) => (
                      <div
                        key={thread.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedThread === thread.id 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedThread(thread.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={
                              profile?.user_type === 'agent' 
                                ? thread.buyer_profiles?.avatar_url 
                                : thread.seller_profiles?.avatar_url
                            } />
                            <AvatarFallback>
                              {(profile?.user_type === 'agent' 
                                ? thread.buyer_profiles?.full_name 
                                : thread.seller_profiles?.full_name)?.charAt(0) || <User className="h-5 w-5" />}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {profile?.user_type === 'agent' 
                                ? thread.buyer_profiles?.full_name || 'Usuario'
                                : thread.seller_profiles?.full_name || 'Usuario'
                              }
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {thread.properties?.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(thread.last_message_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Area */}
                  <div className="lg:col-span-2 border rounded-lg">
                    {selectedThread ? (
                      <DirectChat 
                        propertyId={messageThreads.find(t => t.id === selectedThread)?.property_id || ''} 
                        user={user}
                        isProfileContext={true}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Selecciona una conversación para ver los mensajes</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Actividad reciente en tus propiedades
              </p>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes notificaciones</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notification.user_profiles?.avatar_url} />
                        <AvatarFallback>
                          {notification.user_profiles?.full_name?.charAt(0) || <User className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{notification.message}</p>
                        <p className="text-sm text-muted-foreground">
                          {notification.properties?.title} - {notification.properties?.address}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                      <Badge variant={notification.type === 'favorite' ? 'default' : 'secondary'}>
                        {notification.type === 'favorite' ? 'Favorito' : 'Consulta'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Mis Propiedades
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Gestiona tus propiedades publicadas
              </p>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : myProperties.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes propiedades publicadas</p>
                  <Button className="mt-4">
                    <Building2 className="h-4 w-4 mr-2" />
                    Publicar Propiedad
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myProperties.map((property) => (
                    <Card key={property.id} className="group hover:shadow-lg transition-shadow">
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
                          <Badge variant={property.category === 'sale' ? 'default' : 'secondary'}>
                            {property.category === 'sale' ? 'Venta' : 'Alquiler'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
                        <p className="text-muted-foreground text-sm mb-3">
                          {property.address}, {property.city}
                        </p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {property.bedrooms}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {property.area_m2}m²
                            </span>
                          </div>
                          <div className="text-lg font-bold">
                            {property.price.toLocaleString('es-ES')}€
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Estadísticas
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
                 </TabsContent>
       </Tabs>

       {/* Edit Profile Modal */}
       <EditProfileModal
         isOpen={isEditModalOpen}
         onClose={() => setIsEditModalOpen(false)}
         profile={profile}
         onProfileUpdate={updateProfile}
       />
     </div>
   );
 }
