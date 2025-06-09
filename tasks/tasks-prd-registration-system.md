# Tareas: Sistema de Registro con Foto de Perfil

## Archivos Relevantes

### Archivos Existentes

- `app/api/auth/[...nextauth]/route.js` - Configuración de NextAuth
- `app/api/auth/register/route.js` - Endpoint de registro
- `app/api/auth/register/page.js` - Página de registro
- `app/api/auth/signin/page.js` - Página de inicio de sesión
- `app/api/auth/verify-request/page.js` - Página de solicitud de verificación
- `app/api/auth/error/page.js` - Página de error
- `app/api/auth/check-user/route.js` - Verificación de usuario existente
- `app/api/auth/upload-photo/route.js` - Subida de fotos
- `app/api/auth/create-monday-user/route.js` - Creación en Monday.com
- `libs/google-storage.js` - Utilidades para Google Cloud Storage
- `libs/monday.js` - Utilidades para Monday.com
- `libs/next-auth.js` - Configuración de NextAuth
- `models/User.js` - Modelo de usuario en MongoDB

### Archivos a Crear/Modificar

- `app/api/auth/verify-email/route.js` - Endpoint para verificación de email
- `app/api/auth/verify-email/page.js` - Página de verificación de email
- `components/ImageUpload.js` - Componente de subida de imágenes
- `components/ImageUpload.test.js` - Tests del componente de subida
- `libs/validators.js` - Funciones de validación
- `libs/validators.test.js` - Tests de validación

## Tareas

### 1.0 Actualización del Sistema de Autenticación

- [x] 1.1 Actualizar `libs/next-auth.js` para:

  - [x] 1.1.1 Remover el Proveedor de Google
  - [x] 1.1.2 Remover la autenticación por contraseña del modelo de usuario
  - [x] 1.1.3 Ajustar el callback de sesión para manejar solo email
  - [x] 1.1.4 Actualizar la plantilla del correo de verificación
  - [x] 1.1.5 Configurar el tiempo de expiración del token de verificación

- [x] 1.2 Mejorar la verificación de email:

  - [x] 1.2.1 Implementar validación de dominio de email
  - [x] 1.2.2 Agregar manejo de reintentos de envío
  - [ ] 1.2.3 Mejorar el logging de la verificación
  - [ ] 1.2.4 Implementar límite de intentos de verificación por email

- [ ] 1.3 Actualizar las páginas de autenticación:

  - [ ] 1.3.1 Crear página personalizada de signin solo con email
  - [ ] 1.3.2 Crear página de verify-request con instrucciones claras
  - [ ] 1.3.3 Crear página de error personalizada
  - [ ] 1.3.4 Implementar página de "Reenviar verificación"

- [ ] 1.4 Implementar middleware de protección:
  - [ ] 1.4.1 Crear middleware para rutas protegidas
  - [ ] 1.4.2 Configurar redirecciones para usuarios no autenticados
  - [ ] 1.4.3 Implementar manejo de roles y permisos
  - [ ] 1.4.4 Agregar validación de email verificado

### 2.0 Mejora del Formulario de Registro

- [x] 2.1 Crear componente `ImageUpload` con vista previa
- [x] 2.2 Implementar validaciones de formato y tamaño de imagen
- [x] 2.3 Actualizar `app/api/auth/register/page.js` para usar el nuevo componente
- [x] 2.4 Agregar mensajes de error y éxito
- [x] 2.5 Implementar manejo de estado del formulario

### 3.0 Sistema de Verificación de Email

- [ ] 3.1 Crear endpoint `verify-email`
- [ ] 3.2 Implementar página de verificación
- [ ] 3.3 Configurar redirecciones post-verificación
- [ ] 3.4 Implementar manejo de tokens de verificación

### 4.0 Integración con Monday.com

- [ ] 4.1 Modificar `libs/monday.js` para crear items
- [ ] 4.2 Actualizar la mutación para incluir todos los campos
- [ ] 4.3 Implementar manejo de errores específicos de Monday
- [ ] 4.4 Agregar logs detallados de la integración

### 5.0 Mejoras en el Almacenamiento

- [x] 5.1 Optimizar el proceso de subida a Google Cloud Storage
  - [x] 5.1.1 Implementar subida directa a Google Cloud Storage
  - [x] 5.1.2 Configurar permisos y CORS
  - [x] 5.1.3 Implementar manejo de errores de red
  - [x] 5.1.4 Agregar validación de tipos MIME
- [x] 5.2 Implementar limpieza de archivos temporales
- [x] 5.3 Mejorar el manejo de errores en la subida
- [x] 5.4 Agregar validaciones de seguridad adicionales

### 6.0 Testing y Documentación

- [ ] 6.1 Escribir tests para el componente ImageUpload
- [ ] 6.2 Escribir tests para las validaciones
- [ ] 6.3 Documentar el flujo de registro
- [ ] 6.4 Crear guía de troubleshooting

## Notas

- Priorizar la implementación de la verificación de email ya que es un requisito confirmado
- Mantener la compatibilidad con el sistema existente durante la transición
- Implementar logs detallados para facilitar el debugging
- Asegurar que todas las validaciones se realicen tanto en el cliente como en el servidor
- Mantener la consistencia en el manejo de errores en toda la aplicación
