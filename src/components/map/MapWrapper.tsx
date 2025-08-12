import { PropertyMap } from './PropertyMap';

interface MapWrapperProps {
  user?: any;
}

export function MapWrapper({ user }: MapWrapperProps) {
  return <PropertyMap user={user} />;
}
