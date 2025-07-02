# Configuración de Stripe para Donaciones

## Variables de Entorno Requeridas

Agrega las siguientes variables a tu archivo `.env.local`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Clave secreta de prueba de Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_... # Clave pública de prueba de Stripe
STRIPE_WEBHOOK_SECRET=whsec_... # Secreto del webhook de Stripe

# Para producción, usa las claves live:
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_PUBLISHABLE_KEY=pk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

## Configuración en Stripe Dashboard

### 1. Crear Productos y Precios

Para donaciones recurrentes, crea los siguientes productos en tu dashboard de Stripe:

1. **Donación Mensual - $100 MXN**

   - Producto: "Donación Mensual - $100 MXN"
   - Precio: $100 MXN / mes
   - ID del precio: `price_1OqX2X2X2X2X2X2X2X2X2X2X`

2. **Donación Mensual - $250 MXN**

   - Producto: "Donación Mensual - $250 MXN"
   - Precio: $250 MXN / mes
   - ID del precio: `price_1OqX2X2X2X2X2X2X2X2X2X2X2`

3. **Donación Mensual - $500 MXN**

   - Producto: "Donación Mensual - $500 MXN"
   - Precio: $500 MXN / mes
   - ID del precio: `price_1OqX2X2X2X2X2X2X2X2X2X2X3`

4. **Donación Mensual - $1000 MXN**
   - Producto: "Donación Mensual - $1000 MXN"
   - Precio: $1000 MXN / mes
   - ID del precio: `price_1OqX2X2X2X2X2X2X2X2X2X2X4`

### 2. Configurar Webhook

1. Ve a **Developers > Webhooks** en tu dashboard de Stripe
2. Crea un nuevo endpoint: `https://tu-dominio.com/api/stripe/webhook`
3. Selecciona los siguientes eventos:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Copia el **Signing secret** y agrégalo como `STRIPE_WEBHOOK_SECRET`

### 3. Configurar Checkout

1. Ve a **Settings > Checkout** en tu dashboard
2. Configura las siguientes opciones:
   - **Payment methods**: Tarjetas de crédito/débito
   - **Billing address collection**: Required
   - **Custom fields**: Habilitar para nombre y mensaje del donador
   - **Success page**: `https://tu-dominio.com/donar/gracias`
   - **Cancel page**: `https://tu-dominio.com/donar`

## Pruebas

### Tarjetas de Prueba

Usa estas tarjetas para probar el sistema:

- **Pago exitoso**: `4242 4242 4242 4242`
- **Pago fallido**: `4000 0000 0000 0002`
- **Requiere autenticación**: `4000 0025 0000 3155`

### Datos de Prueba

- **Fecha de vencimiento**: Cualquier fecha futura
- **CVC**: Cualquier número de 3 dígitos
- **Código postal**: Cualquier código postal válido

## Funcionalidades Implementadas

### ✅ Completado

- [x] Formulario de donación con opciones únicas y recurrentes
- [x] Integración con Stripe Checkout
- [x] Página de agradecimiento
- [x] Webhook para procesar eventos de Stripe
- [x] Modelo de base de datos para donaciones
- [x] API para estadísticas de donaciones
- [x] Componente de estadísticas para el dashboard
- [x] Uso del email del usuario logueado
- [x] Información específica de Katalyst

### 🔄 Pendiente

- [ ] Envío de emails de confirmación
- [ ] Portal del cliente para gestionar suscripciones
- [ ] Reportes detallados de donaciones
- [ ] Integración con CRM
- [ ] Certificados de donación
- [ ] Dashboard administrativo para donaciones

## Notas Importantes

1. **Modo de Prueba**: El sistema está configurado para usar las claves de prueba de Stripe
2. **Moneda**: Todas las donaciones están en MXN (Pesos Mexicanos)
3. **Frecuencia**: Las donaciones recurrentes son mensuales
4. **Seguridad**: Los datos de pago nunca se almacenan en tu servidor
5. **Webhooks**: Asegúrate de que tu servidor sea accesible desde internet para recibir webhooks

## Solución de Problemas

### Error: "Webhook signature verification failed"

- Verifica que `STRIPE_WEBHOOK_SECRET` esté configurado correctamente
- Asegúrate de que el endpoint del webhook sea accesible

### Error: "Price ID not found"

- Verifica que los IDs de precio en `DONATION_PRICES` coincidan con los creados en Stripe
- Para donaciones únicas, el sistema crea precios dinámicamente

### Error: "Invalid currency"

- Asegúrate de que tu cuenta de Stripe esté configurada para aceptar MXN
- Verifica que los productos tengan la moneda correcta configurada
