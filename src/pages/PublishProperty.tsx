import { User } from '@supabase/supabase-js';
import { PropertyForm } from '@/components/property/PropertyForm';

import { useNavigate } from 'react-router-dom';

interface PublishPropertyProps {
  user: User | null;
}

export function PublishProperty({ user }: PublishPropertyProps) {
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso denegado</h1>
          <p className="text-muted-foreground">
            Debes iniciar sesión para publicar propiedades.
          </p>
        </div>
      </div>
    );
  }

  const handleSuccess = () => {
    navigate('/profile');
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-background">
      <PropertyForm 
        user={user} 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
