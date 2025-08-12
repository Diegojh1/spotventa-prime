import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Reply, Send, User, MessageSquare, Clock, Edit, Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type CommentReply = Database['public']['Tables']['property_comment_replies']['Row'] & {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

interface CommentRepliesProps {
  commentId: string;
  propertyId: string;
  user?: any;
}

export function CommentReplies({ commentId, propertyId, user }: CommentRepliesProps) {
  const [replies, setReplies] = useState<CommentReply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (commentId) {
      loadReplies();
      checkOwnership();
    }
  }, [commentId, user]);

  const checkOwnership = async () => {
    if (!user) return;

    try {
      const { data: property, error } = await supabase
        .from('properties')
        .select('user_id')
        .eq('id', propertyId)
        .single();

      if (!error && property) {
        setIsOwner(property.user_id === user.id);
      }
    } catch (err) {
      console.error('Error checking ownership:', err);
    }
  };

  const loadReplies = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('property_comment_replies')
        .select('*')
        .eq('comment_id', commentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Get user profiles separately
        const userIds = [...new Set(data.map(reply => reply.user_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });

        // Combine replies with profiles
        const formattedReplies = data.map(reply => ({
          ...reply,
          profiles: profilesMap.get(reply.user_id) || null
        }));

        setReplies(formattedReplies);
      } else {
        setReplies([]);
      }
    } catch (err) {
      console.error('Error loading replies:', err);
      toast({
        title: "Error",
        description: "No se pudieron cargar las respuestas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!newReply.trim() || !user || !isOwner) return;

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('property_comment_replies')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          message: newReply.trim()
        });

      if (error) throw error;

      setNewReply('');
      await loadReplies();
      
      toast({
        title: "Respuesta enviada",
        description: "Tu respuesta se ha publicado correctamente"
      });
    } catch (err) {
      console.error('Error submitting reply:', err);
      toast({
        title: "Error",
        description: "No se pudo enviar la respuesta",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('property_comment_replies')
        .delete()
        .eq('id', replyId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadReplies();
      toast({
        title: "Respuesta eliminada",
        description: "La respuesta se ha eliminado correctamente"
      });
    } catch (err) {
      console.error('Error deleting reply:', err);
      toast({
        title: "Error",
        description: "No se pudo eliminar la respuesta",
        variant: "destructive"
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
      <div className="space-y-3">
        <div className="h-16 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-16 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Reply Form - Only for property owner */}
      {isOwner && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Reply className="h-3 w-3 mr-1" />
                    Responder como vendedor
                  </Badge>
                </div>
                <Textarea
                  placeholder="Escribe tu respuesta..."
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  className="min-h-[80px] resize-none"
                  disabled={submitting}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitReply}
                    disabled={!newReply.trim() || submitting}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? 'Enviando...' : 'Responder'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Replies List */}
      {replies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>{replies.length} respuesta{replies.length !== 1 ? 's' : ''}</span>
          </div>
          
          {replies.map((reply) => (
            <Card key={reply.id} className="ml-8 border-l-2 border-l-gray-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={reply.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {reply.profiles?.full_name?.charAt(0) || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {reply.profiles?.full_name || 'Usuario'}
                        </span>
                        {reply.user_id === user?.id && (
                          <Badge variant="outline" className="text-xs">
                            Tú
                          </Badge>
                        )}
                        {isOwner && reply.user_id === user?.id && (
                          <Badge variant="secondary" className="text-xs">
                            Vendedor
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(reply.created_at)}
                        </span>
                        
                        {/* Delete button for reply author */}
                        {reply.user_id === user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteReply(reply.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-foreground leading-relaxed">
                      {reply.message}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No replies message */}
      {replies.length === 0 && isOwner && (
        <div className="text-center py-4 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay respuestas aún. ¡Sé el primero en responder!</p>
        </div>
      )}
    </div>
  );
}
