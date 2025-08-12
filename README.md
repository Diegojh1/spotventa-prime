# SpotVenta - Plataforma Inmobiliaria

SpotVenta es una plataforma inmobiliaria moderna desarrollada con React, TypeScript y Supabase que permite a usuarios buscar, publicar y gestionar propiedades inmobiliarias.

## 🚀 Características Principales

### Para Compradores/Inquilinos
- **Búsqueda Avanzada**: Filtros por ubicación, precio, tipo de propiedad
- **Búsqueda por Mapa**: Herramienta de dibujo para buscar en zonas específicas
- **Sistema de Favoritos**: Guardar propiedades de interés
- **Comentarios y Consultas**: Interactuar con vendedores
- **Chat Privado**: Comunicación directa con vendedores
- **Notificaciones**: Alertas en tiempo real

### Para Vendedores/Agentes
- **Publicación de Propiedades**: Formulario completo con imágenes
- **Estadísticas Detalladas**: Métricas de visitas, favoritos, consultas
- **Gestión de Consultas**: Respuestas a comentarios y mensajes
- **Panel de Control**: Vista general de todas las publicaciones

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI Components**: Shadcn/ui, Lucide React Icons
- **Mapas**: Leaflet con React-Leaflet
- **Build Tool**: Vite

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd spotventa-prime
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear archivo `.env.local` con:
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 🗄️ Base de Datos

El proyecto utiliza Supabase con las siguientes tablas principales:

- `profiles` - Perfiles de usuario
- `properties` - Propiedades inmobiliarias
- `property_views` - Registro de vistas
- `property_favorites` - Favoritos de usuarios
- `property_comments` - Comentarios públicos
- `property_comment_replies` - Respuestas a comentarios
- `direct_messages` - Mensajes privados
- `message_threads` - Hilos de conversación
- `property_statistics_detailed` - Estadísticas detalladas

## 🚀 Despliegue

1. **Construir para producción**
```bash
npm run build
```

2. **Desplegar en Vercel/Netlify**
- Conectar repositorio
- Configurar variables de entorno
- Deploy automático

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── auth/           # Componentes de autenticación
│   ├── layout/         # Layout y navegación
│   ├── map/            # Componentes de mapas
│   ├── profile/        # Gestión de perfiles
│   ├── property/       # Componentes de propiedades
│   ├── search/         # Búsqueda y filtros
│   └── ui/             # Componentes UI base
├── hooks/              # Custom hooks
├── integrations/       # Configuración de Supabase
├── lib/                # Utilidades y helpers
├── pages/              # Páginas principales
└── types/              # Definiciones de tipos
```

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Vista previa de producción
- `npm run lint` - Linting del código

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abrir un Pull Request
