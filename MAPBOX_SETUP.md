# 🗺️ Herramienta de Búsqueda en Mapa

## ¿Qué es Leaflet?

Leaflet es una biblioteca de JavaScript de código abierto para mapas interactivos. En SpotVenta, lo usamos para la funcionalidad de **búsqueda en mapa con dibujo de zonas**. Utilizamos OpenStreetMap como proveedor de mapas, que es completamente gratuito y no requiere configuración.

## 🚀 Configuración Automática

### ✅ **Sin Configuración Requerida**
- **OpenStreetMap**: Mapas gratuitos y de alta calidad
- **Sin tokens**: No necesitas crear cuentas ni configurar APIs
- **Funcionalidad completa**: Todas las características disponibles inmediatamente

### ✅ **Instalación Automática**
Las dependencias ya están instaladas:
- `leaflet`: Biblioteca principal de mapas
- `react-leaflet`: Integración con React
- `@types/leaflet`: Tipos de TypeScript

## 🎯 Funcionalidades Disponibles

### ✅ **Búsqueda en Mapa**
- Mapa interactivo con zoom y navegación
- Marcadores de todas las propiedades
- Popups con información de cada propiedad
- Centrado automático en Madrid

### ✅ **Herramientas de Dibujo**
- Botón "Dibujar zona" para crear áreas de búsqueda
- Botón "Limpiar" para eliminar zonas dibujadas
- Búsqueda automática de propiedades dentro de la zona

### ✅ **Filtros Avanzados**
- Rango de precio (mínimo y máximo)
- Tipo de propiedad (Apartamento, Casa, Piso, etc.)
- Categoría (Venta o Alquiler)
- Número mínimo de habitaciones

### ✅ **Panel Lateral**
- Lista de propiedades encontradas
- Información detallada de cada propiedad
- Contador de resultados
- Navegación fácil entre propiedades

## 💰 Completamente Gratuito

### ✅ **OpenStreetMap**
- **Sin límites**: Uso ilimitado de mapas
- **Sin costos**: Completamente gratuito
- **Alta calidad**: Mapas detallados y actualizados
- **Sin registro**: No necesitas crear cuentas

### ✅ **Leaflet**
- **Código abierto**: Biblioteca gratuita
- **Comunidad activa**: Soporte y actualizaciones constantes
- **Compatible**: Funciona en todos los navegadores

## 🔧 Solución de Problemas

### Error: "Map not loading"
- Verifica tu conexión a internet
- Asegúrate de que las propiedades tengan coordenadas (latitude/longitude)
- Revisa que las propiedades estén marcadas como activas

### El mapa no muestra propiedades
- Verifica que tengas propiedades en la base de datos
- Asegúrate de que las propiedades tengan coordenadas válidas
- Revisa que las propiedades estén marcadas como activas

### Los iconos no se muestran
- Los iconos se cargan automáticamente desde CDN
- Si hay problemas, verifica tu conexión a internet

## 🎨 Personalización

Puedes personalizar el mapa modificando `src/config/mapbox.ts`:

```typescript
export const MAP_CONFIG = {
  // Cambiar centro por defecto
  defaultCenter: [40.4168, -3.7492], // Madrid
  
  // Cambiar zoom inicial
  defaultZoom: 10,
  
  // Usar diferentes proveedores de mapas
  tileLayer: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
};
```

### Proveedores de mapas alternativos:
```typescript
// OpenStreetMap (actual)
"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

// CartoDB Positron (claro)
"https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"

// CartoDB Dark Matter (oscuro)
"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
```

## 📱 Responsive Design

La herramienta de mapa es completamente responsive:
- **Desktop**: Panel lateral + mapa completo
- **Tablet**: Panel colapsable + mapa
- **Mobile**: Panel superior + mapa

## 🚀 Próximas Funcionalidades

Una vez que todo funcione, podremos añadir:
- Guardar zonas favoritas
- Búsqueda por dirección
- Filtros por distancia
- Comparación de precios por zona
- Estadísticas de mercado por área
- Clustering de marcadores
- Herramientas de dibujo avanzadas

## 🎯 Cómo Usar

1. **Acceder al mapa**: Ve a `/map` o usa el enlace "Búsqueda en mapa"
2. **Usar filtros**: Ajusta precio, tipo, etc. en el panel lateral
3. **Dibujar zona**: Haz click en "Dibujar zona" y crea un área
4. **Explorar**: Click en marcadores para ver detalles

---

¡La herramienta está lista para usar sin configuración adicional! 🎉
