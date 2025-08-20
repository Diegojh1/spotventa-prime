# 🚂 Guía de Deploy en Railway - SpotVenta Backend

## 📋 Pasos para hacer Deploy

### 1. **Preparación del Proyecto**

Ya tienes todo listo:
- ✅ `backend/railway.json` - Configuración de Railway
- ✅ `backend/nixpacks.toml` - Builder configuration
- ✅ `backend/package.json` - Scripts optimizados
- ✅ `backend/server.js` - Servidor configurado

### 2. **Crear Proyecto en Railway**

1. Ve a [railway.app](https://railway.app) y haz login
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Busca y selecciona tu repositorio `spotventa-prime`

### 3. **⚠️ IMPORTANTE: Configurar Root Directory**

Como tu backend está en la carpeta `backend/`:

1. En el dashboard del proyecto, ve a **"Settings"**
2. Busca **"Build & Deploy"**
3. En **"Root Directory"** cambia a: `backend`
4. Click **"Save"**

### 4. **Configurar Variables de Entorno**

Ve a la pestaña **"Variables"** y agrega:

```bash
# Stripe (PRODUCCIÓN - no test)
STRIPE_SECRET_KEY=sk_live_tu_clave_de_produccion
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_de_produccion

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu_service_role_key

# Server
NODE_ENV=production
PORT=$PORT

# CORS (tu frontend)
CORS_ORIGIN=https://mediumspringgreen-hedgehog-499128.hostingersite.com
```

### 5. **Deploy Automático**

Railway empezará a hacer deploy automáticamente. Verás:
- ⏳ Building...
- ⏳ Deploying...
- ✅ Success!

### 6. **Obtener URL del Backend**

Una vez deployed:
1. Ve al dashboard de tu proyecto
2. Copia la URL (ej: `https://tu-app-123abc.railway.app`)
3. **Guarda esta URL** - la necesitarás para tu frontend

### 7. **Verificar que Funciona**

Prueba estas URLs:

**Health Check:**
```
https://tu-app.railway.app/health
```
Deberías ver:
```json
{
  "status": "OK",
  "stripe_configured": true,
  "webhook_configured": true,
  "supabase_configured": true
}
```

**Test de Planes:**
```
https://tu-app.railway.app/api/test/plans
```

### 8. **Configurar Webhook de Stripe**

1. Ve a **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. URL: `https://tu-app.railway.app/api/webhooks/stripe`
4. Selecciona estos eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copia el **Signing secret**
6. Actualiza `STRIPE_WEBHOOK_SECRET` en Railway

### 9. **Actualizar Frontend**

En tu frontend, cambia todas las URLs de:
```javascript
// DE:
const API_URL = 'http://localhost:3001';

// A:
const API_URL = 'https://tu-app.railway.app';
```

## 🔧 Troubleshooting

### Error: "Cannot find module"
- Verifica que `Root Directory` esté configurado como `backend`
- Revisa que todas las dependencias estén en `package.json`

### Error: CORS
- Verifica que `CORS_ORIGIN` tenga la URL exacta de tu frontend
- Sin trailing slash: `https://tu-frontend.com` ❌ `https://tu-frontend.com/`

### Error: 503/504
- Revisa los logs en Railway
- Verifica que el puerto sea `process.env.PORT`
- Asegúrate que las variables de entorno estén configuradas

### Webhook no funciona
- Verifica que la URL del webhook sea correcta
- Usa las claves de **PRODUCCIÓN** de Stripe
- El `STRIPE_WEBHOOK_SECRET` debe ser del webhook de producción

## 🎉 ¡Listo!

Tu backend estará disponible en:
- **API**: `https://tu-app.railway.app`
- **Health**: `https://tu-app.railway.app/health`
- **Webhooks**: `https://tu-app.railway.app/api/webhooks/stripe`

### Próximos pasos:
1. ✅ Backend deployado en Railway
2. 🔄 Actualizar URLs en el frontend
3. 🎯 Configurar webhook de Stripe
4. 🧪 Hacer pruebas completas

---

💡 **Tip**: Guarda la URL de Railway, la necesitarás para conectar tu frontend.
