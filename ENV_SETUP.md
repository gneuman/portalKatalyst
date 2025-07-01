# Configuración de Variables de Entorno

## Archivo .env.local

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

### MongoDB Configuration

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portalKatalyst?retryWrites=true&w=majority
```

### NextAuth Configuration

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

### Resend Email Configuration

```bash
RESEND_API_KEY=your-resend-api-key
RESEND_AUDIENCE_ID=your-audience-id
```

### Monday.com Configuration

```bash
MONDAY_API_KEY=your-monday-api-token
MONDAY_BOARD_ID=your-monday-board-id
```

### Stripe Configuration

```bash
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

### Google Cloud Storage (for profile photos)

```bash
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id
GOOGLE_CLOUD_PRIVATE_KEY=your-google-cloud-private-key
GOOGLE_CLOUD_CLIENT_EMAIL=your-google-cloud-client-email
GOOGLE_CLOUD_BUCKET_NAME=your-google-cloud-bucket-name
```

## Scripts

Todos los scripts en la carpeta `scripts/` ahora usan variables de entorno en lugar de credenciales hardcodeadas. Asegúrate de tener configurado el archivo `.env.local` antes de ejecutar cualquier script.

### Ejemplo de uso:

```bash
# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales reales

# Ejecutar scripts
node scripts/setup-mongodb.js
node scripts/verify-user-complete.js
```

## Seguridad

- ✅ Todas las credenciales están en variables de entorno
- ✅ El archivo `.env.local` está en `.gitignore`
- ✅ No hay credenciales hardcodeadas en el código
- ✅ Los scripts muestran mensajes de error si faltan variables
