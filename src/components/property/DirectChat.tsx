import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, User, MessageSquare, Clock, Phone, Mail, 
  Building2, MapPin, Eye, Heart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type DirectMessage = {
  id: string;
  property_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  is_read?: boolean;
  chat_id?: string;
  sender_profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  receiver_profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

interface DirectChatProps {
  propertyId: string;
  user?: any;
  isProfileContext?: boolean;
}

export function DirectChat({ propertyId, user, isProfileContext = false }: DirectChatProps) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (propertyId && user) {
      checkOwnership();
      loadMessages();
      loadProperty();
    }
  }, [propertyId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkOwnership = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('user_id')
        .eq('id', propertyId)
        .single();

      if (error) throw error;
      
      const isOwnerResult = data.user_id === user.id;
      console.log('Verificación de propiedad:', {
        property_user_id: data.user_id,
        current_user_id: user.id,
        isOwner: isOwnerResult
      });
      
      setIsOwner(isOwnerResult);
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

  const loadMessages = async () => {
    try {
      setLoading(true);
      
      // Load messages for this property and user
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('property_id', propertyId)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('Mensajes cargados:', data);

      // Mark messages as read if user is the receiver
      const unreadMessages = data?.filter(msg => 
        msg.receiver_id === user.id && !msg.is_read
      ) || [];

      if (unreadMessages.length > 0) {
        await supabase
          .from('direct_messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map(msg => msg.id));
      }

      if (data && data.length > 0) {
        // Get user profiles separately
        const userIds = [...new Set([
          ...data.map(msg => msg.sender_id),
          ...data.map(msg => msg.receiver_id)
        ])];

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });

        // Combine messages with profiles
        const formattedMessages = data.map(message => ({
          ...message,
          sender_profiles: profilesMap.get(message.sender_id) || null,
          receiver_profiles: profilesMap.get(message.receiver_id) || null
        }));

        console.log('Mensajes formateados:', formattedMessages);
        setMessages(formattedMessages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !property) return;

    try {
      setSubmitting(true);

      let receiverId: string;

      if (isOwner) {
        // Si el usuario es el propietario (vendedor), debe responder al comprador
        if (messages.length === 0) {
          toast({
            title: "No hay mensajes",
            description: "No hay mensajes para responder",
            variant: "destructive"
          });
          return;
        }
        
        // Buscar el primer mensaje que NO sea del propietario (debe ser del comprador)
        const buyerMessage = messages.find(msg => msg.sender_id !== user.id);
        if (!buyerMessage) {
          toast({
            title: "Error",
            description: "No se encontró el comprador para responder",
            variant: "destructive"
          });
          return;
        }
        receiverId = buyerMessage.sender_id;
      } else {
        // Si el usuario NO es el propietario, es el comprador enviando al vendedor
        receiverId = property.user_id;
      }

      console.log('Enviando mensaje:', {
        sender_id: user.id,
        receiver_id: receiverId,
        isOwner,
        property_owner: property.user_id
      });

      // Insertar mensaje
      const { error: messageError } = await supabase
        .from('direct_messages')
        .insert({
          property_id: propertyId,
          sender_id: user.id,
          receiver_id: receiverId,
          message: newMessage.trim()
        });

      if (messageError) throw messageError;

      // Actualizar o crear thread de mensajes
      const { error: threadError } = await supabase
        .from('message_threads')
        .upsert({
          property_id: propertyId,
          buyer_id: isOwner ? receiverId : user.id,
          seller_id: isOwner ? user.id : receiverId,
          last_message_at: new Date().toISOString()
        }, {
          onConflict: 'property_id,buyer_id,seller_id'
        });

      if (threadError) throw threadError;

      setNewMessage('');
      await loadMessages();
      
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje se ha enviado correctamente"
      });
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const formatPrice = (price: number) => {
    return price.toLocaleString('es-ES');
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Inicia sesión para chatear</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Property Info Header */}
      {property && (
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{property.title}</h3>
              <p className="text-sm text-muted-foreground">
                {property.address}, {property.city}
              </p>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {property.bedrooms} hab
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {property.area_m2}m²
                </span>
                <span className="font-semibold text-foreground">
                  {formatPrice(property.price)}€
                </span>
              </div>
            </div>
            <Badge variant={property.category === 'sale' ? 'default' : 'secondary'}>
              {property.category === 'sale' ? 'Venta' : 'Alquiler'}
            </Badge>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-start gap-3 justify-end">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4 ml-auto"></div>
                <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay mensajes aún</p>
            <p className="text-sm">
              {isOwner 
                ? "Los mensajes de los compradores aparecerán aquí" 
                : "¡Inicia la conversación!"
              }
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === user.id;
            return (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  isOwnMessage ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isOwnMessage && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender_profiles?.avatar_url} />
                    <AvatarFallback>
                      {message.sender_profiles?.full_name?.charAt(0) || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-xs lg:max-w-md space-y-1 ${
                  isOwnMessage ? 'order-first' : ''
                }`}>
                  <div className={`flex items-center gap-2 text-xs text-muted-foreground ${
                    isOwnMessage ? 'justify-end' : 'justify-start'
                  }`}>
                    <span>{message.sender_profiles?.full_name || 'Usuario'}</span>
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(message.created_at)}</span>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${
                    isOwnMessage 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.message}</p>
                  </div>
                </div>

                {isOwnMessage && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender_profiles?.avatar_url} />
                    <AvatarFallback>
                      {message.sender_profiles?.full_name?.charAt(0) || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Show for non-owners or owners in profile context */}
      {(!isOwner || (isOwner && isProfileContext)) && (
        <div className="p-4 border-t bg-white">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Textarea
                placeholder="Escribe tu mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="min-h-[60px] resize-none"
                disabled={submitting}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || submitting}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      )}
      
      {/* Show message for owners (only when not in profile context) */}
      {isOwner && !isProfileContext && (
        <div className="p-4 border-t bg-gray-50 text-center text-muted-foreground">
          <p className="text-sm">Como propietario, puedes ver los mensajes pero no enviar nuevos</p>
        </div>
      )}
    </div>
  );
}
