import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  user_type: 'buyer' | 'agent' | null;
  plan_type: 'free' | 'premium' | null;
  company_name: string | null;
  website: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && user.id) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user || !user.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Solo mostrar error si no es un error de "no encontrado" (que es normal para usuarios nuevos)
        if (error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          // Solo mostrar toast si es un error real, no cuando el usuario no está autenticado
          if (user) {
            toast({
              title: "Error",
              description: "No se pudo cargar el perfil",
              variant: "destructive"
            });
          }
        }
        // Si no hay perfil, lo creamos automáticamente
        await createDefaultProfile();
      } else {
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultProfile = async () => {
    if (!user || !user.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          user_type: 'buyer',
          plan_type: 'free'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
      } else {
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !user.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el perfil",
          variant: "destructive"
        });
        return false;
      } else {
        setProfile(data as UserProfile);
        toast({
          title: "Perfil actualizado",
          description: "Tu perfil se ha actualizado correctamente"
        });
        return true;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile
  };
}
