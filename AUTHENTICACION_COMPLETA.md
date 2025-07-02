# Sistema de Autenticación Completo - Katalyst

## Resumen

El sistema de autenticación de Katalyst ahora soporta **dos métodos de autenticación**:

1. **Magic Links (Enlaces Mágicos)** - Método principal y por defecto
2. **Email y Contraseña** - Método alternativo para usuarios que prefieren contraseñas

## Características Principales

### ✅ **Doble Método de Autenticación**

- Los usuarios pueden elegir entre magic links o email/contraseña
- Detección automática de si el usuario tiene contraseña configurada
- Interfaz adaptativa que se ajusta según las opciones disponibles

### ✅ **Seguridad Mejorada**

- Contraseñas hasheadas con bcrypt (12 rondas de salt)
- Validación de contraseñas (mínimo 6 caracteres)
- Verificación de contraseña actual para cambios
- Tokens de verificación seguros para magic links

### ✅ **Experiencia de Usuario**

- Interfaz intuitiva con selector de método
- Mensajes claros sobre opciones disponibles
- Redirección automática según el estado del perfil
- Integración con Monday.com y MongoDB

## Flujo de Autenticación

### Para Usuarios Nuevos:

1. **Ingreso de Email** → Sistema detecta si existe en Monday.com y MongoDB
2. **Creación Automática** → Si no existe, se crea en ambos sistemas
3. **Completar Perfil** → Redirección a `/register/complete-profile`
4. **Configurar Contraseña** → Opcional en `/set-password`
5. **Acceso Completo** → Al dashboard

### Para Usuarios Existentes:

1. **Ingreso de Email** → Sistema verifica existencia
2. **Selección de Método** → Magic link o contraseña
3. **Autenticación** → Según método elegido
4. **Verificación de Perfil** → Si está completo, va al dashboard
5. **Completar Perfil** → Si está incompleto, redirección

## Endpoints de la API

### Autenticación

- `POST /api/auth/set-password` - Establecer contraseña
- `PUT /api/auth/set-password` - Cambiar contraseña
- `GET /api/auth/check-password` - Verificar si tiene contraseña

### Verificación

- `GET /api/user/profile` - Obtener perfil de usuario
- `POST /api/monday/contact/find` - Buscar en Monday.com

## Componentes

### `SetPasswordForm.js`

- Formulario para establecer/cambiar contraseñas
- Validaciones de seguridad
- Modos: "set" (nueva) y "change" (cambiar)

### Páginas

- `/api/auth/signin` - Página principal de autenticación
- `/set-password` - Página para configurar contraseña
- `/register/complete-profile` - Completar perfil

## Configuración del Modelo de Usuario

### Campos Agregados:

```javascript
{
  password: {
    type: String,
    private: true,
    minlength: 6,
    select: false, // No incluir en consultas por defecto
  },
  hasPassword: {
    type: Boolean,
    default: false,
  },
  emailVerified: {
    type: Date,
    default: null,
  }
}
```

### Métodos Agregados:

- `comparePassword(candidatePassword)` - Comparar contraseñas
- `hasPasswordSet()` - Verificar si tiene contraseña
- `findByEmailWithPassword(email)` - Buscar con contraseña incluida

## Configuración de NextAuth

### Proveedores Configurados:

1. **GoogleProvider** - OAuth con Google
2. **CredentialsProvider** - Email y contraseña
3. **EmailProvider** - Magic links con Resend

### Callbacks Implementados:

- `signIn` - Verificación de perfil y redirección
- `redirect` - Manejo de URLs de redirección
- `session` - Enriquecimiento de datos de sesión

## Variables de Entorno Requeridas

```env
# NextAuth
NEXTAUTH_SECRET=tu_secret_muy_seguro_aqui_minimo_32_caracteres
NEXTAUTH_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb+srv

# Resend (para magic links)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Monday.com
MONDAY_API_KEY=tu_api_key_de_monday
MONDAY_BOARD_ID=123456789

# Google OAuth (opcional)
GOOGLE_ID=tu_google_client_id
GOOGLE_SECRET=tu_google_client_secret
```

## Instalación de Dependencias

```bash
npm install bcryptjs
```

## Flujo de Uso

### 1. Usuario Nuevo sin Contraseña:

1. Va a `/api/auth/signin`
2. Ingresa email
3. Sistema crea cuenta automáticamente
4. Redirige a completar perfil
5. Opcional: Configurar contraseña en `/set-password`

### 2. Usuario Existente con Contraseña:

1. Va a `/api/auth/signin`
2. Ingresa email
3. Sistema detecta que tiene contraseña
4. Puede elegir entre magic link o contraseña
5. Se autentica según método elegido

### 3. Usuario Existente sin Contraseña:

1. Va a `/api/auth/signin`
2. Ingresa email
3. Sistema detecta que no tiene contraseña
4. Solo puede usar magic link
5. Opcional: Configurar contraseña

## Beneficios del Sistema

### 🔒 **Seguridad**

- Contraseñas hasheadas con bcrypt
- Tokens seguros para magic links
- Validación de entrada
- Protección contra ataques comunes

### 🎯 **Flexibilidad**

- Dos métodos de autenticación
- Detección automática de capacidades
- Interfaz adaptativa
- Migración suave entre métodos

### 🚀 **Experiencia de Usuario**

- Proceso simplificado
- Mensajes claros
- Redirección inteligente
- Opciones configurables

### 🔧 **Mantenibilidad**

- Código modular
- Documentación completa
- Endpoints bien definidos
- Manejo de errores robusto

## Próximos Pasos Recomendados

1. **Configurar variables de entorno** según la lista anterior
2. **Instalar bcryptjs** si no está instalado
3. **Probar ambos métodos** de autenticación
4. **Configurar dominio en Resend** para producción
5. **Revisar logs** para identificar problemas
6. **Personalizar mensajes** según necesidades

## Soporte

Para problemas o preguntas sobre el sistema de autenticación:

- Revisar logs del servidor
- Verificar configuración de variables de entorno
- Comprobar conectividad con MongoDB y Resend
- Validar configuración de Monday.com
