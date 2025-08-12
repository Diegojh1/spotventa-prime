import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PropertyInquiryProps {
  propertyId: string;
  propertyTitle: string;
  user: any;
}

export function PropertyInquiry({ propertyId, propertyTitle, user }: PropertyInquiryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    contact_phone: '',
    contact_email: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para hacer una consulta",
        variant: "destructive"
      });
      return;
    }

    if (!formData.message.trim()) {
      toast({
        title: "Error",
        description: "Por favor, escribe tu mensaje",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('property_inquiries')
        .insert({
          property_id: propertyId,
          user_id: user.id,
          message: formData.message.trim(),
          contact_phone: formData.contact_phone || null,
          contact_email: formData.contact_email || null
        });

      if (error) {
        console.error('Error creating inquiry:', error);
        toast({
          title: "Error",
          description: "No se pudo enviar la consulta. Inténtalo de nuevo.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Consulta enviada",
        description: "Tu consulta ha sido enviada al vendedor. Te contactaremos pronto."
      });

      // Reset form and close dialog
      setFormData({
        message: '',
        contact_phone: '',
        contact_email: ''
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating inquiry:', error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error inesperado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          <MessageSquare className="h-4 w-4 mr-2" />
          Hacer consulta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Consulta sobre {propertyTitle}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Mensaje *</Label>
            <Textarea
              id="message"
              placeholder="Escribe tu consulta sobre esta propiedad..."
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Teléfono (opcional)</Label>
              <Input
                id="contact_phone"
                type="tel"
                placeholder="+34 600 000 000"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Email (opcional)</Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="tu@email.com"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.message.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar consulta
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
