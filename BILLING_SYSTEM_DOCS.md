# 📊 SISTEMA DE FACTURACIÓN - SPOTVENTA

## 🎯 DESCRIPCIÓN GENERAL

Sistema híbrido de facturación que combina visualización personalizada con gestión robusta via Stripe Customer Portal. Diseñado para máxima seguridad, mínimo mantenimiento y experiencia de usuario optimal.

---

## 🏗️ ARQUITECTURA

### **ENFOQUE HÍBRIDO**
```
┌─────────────────────────┐    ┌─────────────────────────┐
│    DASHBOARD CUSTOM     │    │   STRIPE PORTAL         │
│   (Visualización)       │    │   (Gestión)             │
├─────────────────────────┤    ├─────────────────────────┤
│ ✅ Plan actual          │    │ ✅ Cambiar tarjeta      │
│ ✅ Próxima renovación   │ →  │ ✅ Cancelar plan        │
│ ✅ Método de pago       │    │ ✅ Descargar facturas   │
│ ✅ Historial facturas   │    │ ✅ Actualizar datos     │
│ ✅ Botón "Gestionar"    │    │ ✅ Cambiar plan         │
└─────────────────────────┘    └─────────────────────────┘
```

### **VENTAJAS DE ESTE ENFOQUE**
- 🛡️ **Seguridad**: Stripe maneja datos sensibles
- 💰 **Costo-eficiencia**: Menos desarrollo y mantenimiento
- ⚡ **Velocidad**: Funcionalidades robustas sin custom code
- 🎨 **UX**: Dashboard integrado en tu marca

---

## 📂 ESTRUCTURA DE ARCHIVOS

```
├── backend/
│   ├── server.js                    # APIs de facturación
│   └── .env                         # Credenciales (Stripe + Supabase)
│
├── src/
│   ├── components/
│   │   └── billing/
│   │       └── BillingDashboard.tsx # Componente principal
│   └── pages/
│       └── Profile.tsx              # Integración en perfil
│
└── docs/
    └── BILLING_SYSTEM_DOCS.md       # Esta documentación
```

---

## 🔌 APIs BACKEND

### **📊 GET /api/billing/dashboard/:userId**

**Descripción**: Obtiene información completa de facturación

**Parámetros**:
- `userId` (string): ID del usuario en Supabase

**Respuesta**:
```json
{
  "currentPlan": {
    "subscriptionId": "sub_xxxxxxxxx",
    "name": "Plan Profesional",
    "status": "active",
    "currentPeriodEnd": "2025-08-23T00:00:00.000Z",
    "billingCycle": "monthly",
    "amount": 19.99,
    "currency": "eur",
    "cancelAtPeriodEnd": false
  },
  "paymentMethod": {
    "id": "pm_xxxxxxxxx",
    "type": "card",
    "brand": "visa",
    "last4": "4242",
    "expMonth": 12,
    "expYear": 2025
  },
  "invoices": [
    {
      "id": "in_xxxxxxxxx",
      "date": "2025-01-23T00:00:00.000Z",
      "amount": 19.99,
      "currency": "eur",
      "status": "paid",
      "description": "Suscripción Plan Profesional",
      "invoiceUrl": "https://invoice.stripe.com/...",
      "downloadUrl": "https://files.stripe.com/..."
    }
  ],
  "hasStripeCustomer": true,
  "customerId": "cus_xxxxxxxxx"
}
```

**Estados de Error**:
- `404`: Usuario no encontrado
- `500`: Error interno del servidor

---

### **🎛️ POST /api/billing/portal**

**Descripción**: Crea sesión del Customer Portal de Stripe

**Body**:
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Respuesta**:
```json
{
  "url": "https://billing.stripe.com/session/...",
  "sessionId": "bps_xxxxxxxxx"
}
```

**Estados de Error**:
- `404`: Usuario no encontrado o sin suscripciones
- `500`: Error creando sesión

---

## 🎨 COMPONENTE FRONTEND

### **BillingDashboard**

**Props**:
```typescript
interface BillingDashboardProps {
  userId: string;
  className?: string;
}
```

**Estados**:
- `loading`: Cargando datos
- `error`: Error al cargar
- `noSubscription`: Usuario sin suscripciones
- `ready`: Datos cargados correctamente

**Funcionalidades**:
- ✅ Visualización de plan actual
- ✅ Información de método de pago
- ✅ Historial de facturas
- ✅ Descarga de PDFs
- ✅ Integración con Stripe Portal
- ✅ Estados de carga y error
- ✅ Responsive design

---

## 🔧 CONFIGURACIÓN

### **Variables de Entorno - Backend**
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxxxx

# Server
PORT=3001
CORS_ORIGIN=http://localhost:8081
```

### **Variables de Entorno - Frontend**
```env
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# API
VITE_API_URL=http://localhost:3001

# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxx
```

---

## 🔒 SEGURIDAD

### **QUÉ SE GUARDA EN TU BD**
✅ **SEGURO DE GUARDAR**:
```json
{
  "stripe_customer_id": "cus_xxxxxxxxx",     // Solo referencia
  "stripe_payment_method_id": "pm_xxxxxxxxx", // Solo referencia
  "card_brand": "visa",                        // Público
  "card_last4": "4242",                       // Solo últimos 4
  "amount": 19.99,                            // Monto
  "status": "succeeded",                      // Estado
  "currency": "eur"                           // Moneda
}
```

❌ **NUNCA GUARDAR**:
```json
{
  "card_number": "4242424242424242",    // ❌ NUNCA
  "cvv": "123",                         // ❌ NUNCA
  "exp_date": "12/25",                  // ❌ NUNCA
  "cardholder_name": "John Doe"         // ❌ NUNCA
}
```

### **PRINCIPIOS DE SEGURIDAD**
- 🛡️ **Separación de responsabilidades**: Tu app maneja UX, Stripe maneja datos sensibles
- 🔐 **Referencias seguras**: Solo guardas IDs que apuntan a datos en Stripe
- 🎯 **PCI DSS Compliance**: No necesitas certificación porque no manejas datos de tarjeta
- 🔒 **Service Role Key**: Backend usa clave especial para acceso directo a BD

---

## 🚀 INSTALACIÓN Y DESPLIEGUE

### **1. Instalación de Dependencias**
```bash
# Backend
cd backend
npm install @supabase/supabase-js

# Frontend (ya incluido)
# @stripe/stripe-js está instalado
```

### **2. Configuración de Stripe**
1. Crear productos en Stripe Dashboard
2. Obtener Product IDs y Price IDs
3. Actualizar configuración en `backend/server.js`
4. Configurar webhooks (opcional para desarrollo)

### **3. Configuración de Supabase**
1. Obtener URL del proyecto
2. Obtener Service Role Key (NO anon key)
3. Configurar variables de entorno

### **4. Testing**
```bash
# Verificar backend
curl http://localhost:3001/health

# Verificar APIs
curl http://localhost:3001/api/test/plans

# Test completo
# 1. Ir a /profile
# 2. Click en pestaña "Facturación"
# 3. Verificar que carga datos
# 4. Click en "Gestionar Plan"
# 5. Verificar redirección a Stripe
```

---

## 📈 ROADMAP FUTURO

### **🔥 PRÓXIMAS FUNCIONALIDADES**
1. **Webhooks completos** - Sincronización automática
2. **Billing history en BD** - Reportes y analytics
3. **Sistema de recuperación** - Pagos fallidos
4. **Métricas de negocio** - MRR, churn rate, etc.

### **🎯 MEJORAS PLANIFICADAS**
1. **Notificaciones por email** - Recordatorios de pago
2. **Descuentos y promociones** - Cupones automáticos
3. **Facturación por usage** - Planes por propiedades
4. **Multi-tenant support** - Equipos y organizaciones

---

## 🐛 TROUBLESHOOTING

### **❌ Error: "supabaseKey is required"**
**Solución**: Verificar que `SUPABASE_SERVICE_KEY` esté en `backend/.env`

### **❌ Error: "Usuario no encontrado"**
**Solución**: Verificar que el usuario exista en tabla `profiles`

### **❌ Error: "No tienes suscripciones activas"**
**Solución**: Usuario no tiene customer en Stripe, dirigir a página de planes

### **❌ Error: "Error creating payment intent"**
**Solución**: Verificar claves de Stripe y que products/prices existan

### **🔍 Debug Mode**
```bash
# Ver logs del backend
npm run dev

# Ver logs en browser
console.log en componente BillingDashboard
```

---

## 👥 CONTACTO Y SOPORTE

**Equipo**: SpotVenta Development Team
**Documentación**: Este archivo
**Issues**: Crear ticket en repositorio
**Versión**: 1.0.0

---

**⚡ IMPORTANTE**: Este sistema está diseñado para producción. Todos los aspectos críticos de seguridad y facturación están delegados a Stripe, que es PCI DSS Level 1 certified.
