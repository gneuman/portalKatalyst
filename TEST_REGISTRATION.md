# Sistema de Registro - Testing

Este documento describe cómo probar el sistema de registro que hemos creado para verificar que funcione correctamente con MongoDB y la generación de tokens.

## Endpoints Creados

### 1. Test Registration (`/api/test-registration`)

- **POST**: Registra un nuevo usuario en MongoDB y genera un token de verificación
- **GET**: Verifica un token de verificación y actualiza el estado del usuario

### 2. Update Monday ID (`/api/update-monday-id`)

- **POST**: Actualiza un usuario existente con Monday ID (personal o business)
- **GET**: Obtiene información de un usuario por email

## Páginas de Testing

### 1. Test Registration Page (`/test-registration`)

- Formulario para probar el registro de usuarios
- Muestra los datos del usuario creado y el token generado
- Permite verificar tokens directamente desde la interfaz

### 2. Test Monday Update Page (`/test-monday-update`)

- Formulario para probar la actualización de Monday ID
- Permite consultar información de usuarios existentes

## Cómo Probar

### Paso 1: Probar el Registro

1. Ve a `http://localhost:3000/test-registration`
2. Completa el formulario con:
   - Email (requerido)
   - Nombre completo
   - Nombre y apellido
   - Teléfono
3. Haz clic en "Registrar Usuario"
4. Verifica que:
   - Se cree el usuario en MongoDB
   - Se genere un token de verificación
   - Se muestre la URL de verificación

### Paso 2: Probar la Verificación

1. En la página de test, haz clic en "Verificar Token"
2. O visita directamente la URL de verificación
3. Verifica que:
   - El usuario se marque como validado
   - Se actualice `emailVerified`
   - Se elimine el token usado

### Paso 3: Probar Monday ID Update

1. Ve a `http://localhost:3000/test-monday-update`
2. Usa el email de un usuario registrado
3. Agrega un Monday ID (personal o business)
4. Verifica que se actualice correctamente

## Estructura de Datos

### Usuario en MongoDB

```json
{
  "_id": "ObjectId",
  "email": "usuario@ejemplo.com",
  "name": "Nombre Completo",
  "firstName": "Nombre",
  "lastName": "Apellido",
  "phone": "123456789",
  "validado": false,
  "emailVerified": null,
  "personalMondayId": "",
  "businessMondayId": [],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Token de Verificación

```json
{
  "_id": "ObjectId",
  "identifier": "usuario@ejemplo.com",
  "token": "token_hex_32_caracteres",
  "expires": "2024-01-01T01:00:00.000Z"
}
```

## Respuestas de la API

### Registro Exitoso

```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": "user_id",
      "email": "usuario@ejemplo.com",
      "name": "Nombre",
      "validado": false,
      "emailVerified": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": {
      "id": "token_id",
      "token": "token_hex",
      "expires": "2024-01-01T01:00:00.000Z",
      "verificationUrl": "http://localhost:3000/api/test-registration?token=...&email=..."
    }
  }
}
```

### Verificación Exitosa

```json
{
  "success": true,
  "message": "Email verificado exitosamente",
  "user": {
    "id": "user_id",
    "email": "usuario@ejemplo.com",
    "validado": true,
    "emailVerified": "2024-01-01T00:30:00.000Z"
  }
}
```

## Próximos Pasos

Una vez que confirmes que el sistema de registro funciona correctamente:

1. **Integrar con Monday.com**: Agregar la lógica para crear usuarios en Monday.com
2. **Envío de emails**: Implementar el envío real de emails con Resend
3. **Seguridad**: Agregar validaciones adicionales y rate limiting
4. **UI/UX**: Mejorar las interfaces de usuario
5. **Testing**: Crear tests automatizados

## Troubleshooting

### Error de Conexión a MongoDB

- Verifica que `MONGODB_URI` esté configurado en las variables de entorno
- Asegúrate de que MongoDB esté ejecutándose

### Error de Token

- Los tokens expiran después de 1 hora
- Verifica que el token y email coincidan

### Usuario Duplicado

- El sistema detecta usuarios existentes y devuelve un error 409
- Usa un email diferente para pruebas

## Variables de Entorno Requeridas

```env
MONGODB_URI=mongodb://localhost:27017/portalKatalyst
NEXTAUTH_URL=http://localhost:3000
```

## Corrección de Colecciones

Si tienes colecciones con nombres incorrectos (como `verificationtokens` en lugar de `verification_tokens`), ejecuta el script de corrección:

```bash
node scripts/fix-collections.js
```

Este script:

- Migra datos de `verificationtokens` a `verification_tokens`
- Crea las colecciones correctas si no existen
- Elimina las colecciones incorrectas
- Muestra un reporte de las colecciones finales
