import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, Send, User, Clock, Edit, Trash2, Reply
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { CommentReplies } from './CommentReplies';

type PropertyComment = Database['public']['Tables']['property_comments']['Row'] & {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

interface PropertyCommentsProps {
  propertyId: string;
  user?: any;
}

export function PropertyComments({ propertyId, user }: PropertyCommentsProps) {
  const [comments, setComments] = useState<PropertyComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  useEffect(() => {
    if (propertyId) {
      loadComments();
    }
  }, [propertyId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      
      // Get comments first
      const { data: commentsData, error: commentsError } = await supabase
        .from('property_comments')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // Get user IDs from comments
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];

      // Get profiles for all users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user profiles
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Combine comments with user data
      const formattedComments = commentsData.map(comment => ({
        ...comment,
        profiles: profilesMap.get(comment.user_id) || null
      }));

      setComments(formattedComments);
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los comentarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('property_comments')
        .insert({
          property_id: propertyId,
          user_id: user.id,
          message: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      await loadComments();
      
      toast({
        title: "Comentario enviado",
        description: "Tu comentario se ha publicado correctamente"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo enviar el comentario",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('property_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadComments();
      toast({
        title: "Comentario eliminado",
        description: "El comentario se ha eliminado correctamente"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el comentario",
        variant: "destructive"
      });
    }
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comentarios y preguntas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        {user ? (
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Escribe tu comentario o pregunta..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={submitting}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Enviando...' : 'Comentar'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Inicia sesión para dejar un comentario</p>
          </div>
        )}

        <Separator />

        {/* Comments List */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-24 bg-muted animate-pulse rounded-lg"></div>
            <div className="h-24 bg-muted animate-pulse rounded-lg"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {comment.profiles?.full_name?.charAt(0) || <User className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {comment.profiles?.full_name || 'Usuario'}
                        </span>
                        {comment.user_id === user?.id && (
                          <Badge variant="outline" className="text-xs">
                            Tú
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(comment.created_at)}
                        </span>
                        
                        {/* Delete button for comment author */}
                        {comment.user_id === user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-foreground leading-relaxed">
                      {comment.message}
                    </p>

                    {/* Reply button */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleReplies(comment.id)}
                        className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Reply className="h-3 w-3" />
                        {showReplies[comment.id] ? 'Ocultar respuestas' : 'Ver respuestas'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Replies Section */}
                {showReplies[comment.id] && (
                  <div className="ml-12">
                    <CommentReplies 
                      commentId={comment.id} 
                      propertyId={propertyId} 
                      user={user} 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
