import { useEffect } from 'react';
import { MapWrapper } from '@/components/map/MapWrapper';

interface MapSearchProps {
  user?: any;
}

export function MapSearch({ user }: MapSearchProps) {
  useEffect(() => {
    // Añadir clase al body para prevenir scroll
    document.body.classList.add('map-page');
    
    // Limpiar al desmontar
    return () => {
      document.body.classList.remove('map-page');
    };
  }, []);

  return (
    <div className="h-screen overflow-hidden">
      <MapWrapper user={user} />
    </div>
  );
}
