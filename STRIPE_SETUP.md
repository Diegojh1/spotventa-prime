# Configuración de Stripe para SpotVenta

## 🚀 Pasos para configurar la pasarela de pagos

### 1. Crear cuenta en Stripe

1. Ve a [stripe.com](https://stripe.com) y crea una cuenta
2. Completa la verificación de tu cuenta
3. Accede al Dashboard de Stripe

### 2. Configurar productos y precios en Stripe

#### Crear productos:

1. Ve a **Products** en el Dashboard de Stripe
2. Crea los siguientes productos:

**Plan Básico:**
- Nombre: "Plan Básico"
- ID: `prod_basic_plan`
- Descripción: "Plan gratuito con 2 propiedades"

**Plan Profesional:**
- Nombre: "Plan Profesional"
- ID: `prod_professional_plan`
- Descripción: "Para agentes inmobiliarios"

**Plan Premium:**
- Nombre: "Plan Premium"
- ID: `prod_premium_plan`
- Descripción: "Para agencias grandes"

#### Crear precios:

Para cada producto, crea los siguientes precios:

**Plan Básico:**
- `price_basic_monthly`: €0/mes
- `price_basic_yearly`: €0/año

**Plan Profesional:**
- `price_professional_monthly`: €19.99/mes
- `price_professional_yearly`: €199.99/año

**Plan Premium:**
- `price_premium_monthly`: €39.99/mes
- `price_premium_yearly`: €399.99/año

### 3. Obtener las claves de API

1. Ve a **Developers > API keys** en el Dashboard de Stripe
2. Copia las siguientes claves:
   - **Publishable key** (empieza con `pk_test_`)
   - **Secret key** (empieza con `sk_test_`)

### 4. Configurar webhooks

1. Ve a **Developers > Webhooks**
2. Haz clic en **Add endpoint**
3. URL: `https://tu-dominio.com/api/webhooks/stripe`
4. Eventos a escuchar:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copia el **Webhook signing secret** (empieza con `whsec_`)

### 5. Configurar variables de entorno

#### Frontend (.env):
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_aqui
VITE_API_URL=http://localhost:3001
```

#### Backend (.env):
```env
STRIPE_SECRET_KEY=sk_test_tu_clave_aqui
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:8085
```

### 6. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 7. Iniciar el servidor backend

```bash
cd backend
npm run dev
```

### 8. Probar la integración

1. Inicia el frontend: `npm run dev`
2. Ve a la página de suscripciones
3. Selecciona un plan de pago
4. Completa el proceso de pago con una tarjeta de prueba

## 🧪 Tarjetas de prueba de Stripe

Para probar los pagos, usa estas tarjetas:

- **Pago exitoso**: `4242 4242 4242 4242`
- **Pago fallido**: `4000 0000 0000 0002`
- **Requiere autenticación**: `4000 0025 0000 3155`

## 🔒 Seguridad

### Frontend (Seguro):
- ✅ Clave pública de Stripe
- ✅ Configuración de productos
- ✅ URLs de API

### Backend (Privado):
- ✅ Clave secreta de Stripe
- ✅ Webhook secrets
- ✅ Lógica de procesamiento de pagos

## 📊 Monitoreo

### Dashboard de Stripe:
- Pagos procesados
- Suscripciones activas
- Facturación
- Métricas de conversión

### Logs del backend:
- Eventos de webhook
- Errores de pago
- Creación de suscripciones

## 🚨 Producción

Para pasar a producción:

1. Cambia las claves de `test` a `live`
2. Configura webhooks con tu dominio real
3. Actualiza las URLs de CORS
4. Configura SSL/TLS
5. Implementa monitoreo de errores
6. Configura alertas de pago fallido

## 📞 Soporte

- [Documentación de Stripe](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Stripe Community](https://community.stripe.com)

## 🔄 Flujo de pago

1. Usuario selecciona plan
2. Frontend crea Payment Intent
3. Usuario ingresa datos de tarjeta
4. Stripe procesa el pago
5. Webhook actualiza la base de datos
6. Usuario recibe confirmación
7. Suscripción se activa automáticamente

## 💰 Facturación

- **Mensual**: Se cobra cada mes
- **Anual**: Se cobra una vez al año (con descuento)
- **Renovación automática**: Las suscripciones se renuevan automáticamente
- **Cancelación**: Se puede cancelar en cualquier momento
- **Reembolsos**: Se pueden procesar reembolsos parciales o totales
