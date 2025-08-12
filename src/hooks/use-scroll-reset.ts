import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollReset() {
  const location = useLocation();
  
  useEffect(() => {
    // Resetear scroll al inicio de la página
    window.scrollTo(0, 0);
    
    // También resetear el scroll del body para asegurar que no haya scroll residual
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, [location.pathname]);
}
