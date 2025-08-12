// Configuración de Mapas
// Ahora usamos Leaflet con OpenStreetMap (gratuito y sin configuración)

export const MAP_CONFIG = {
  // Centro por defecto (Madrid)
  defaultCenter: [40.4168, -3.7492] as [number, number],
  defaultZoom: 10,
  
  // Proveedor de mapas (OpenStreetMap)
  tileLayer: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

// Configuración para futuras mejoras
export const MAP_FEATURES = {
  drawingEnabled: true,
  clusteringEnabled: false,
  searchEnabled: true
};
