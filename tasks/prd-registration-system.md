# PRD: Sistema de Registro con Foto de Perfil.

## Introducción/Descripción General

El sistema de registro debe permitir a los usuarios registrarse con su información personal y foto de perfil, sincronizando los datos entre MongoDB y Monday.com, y almacenando las fotos en Google Cloud Storage.

## Objetivos

1. Subir foto a Google Cloud Storage
2. Mejorar el formato existente para que cuando se cree el usuario en monday.com tenga ya laFoto Perfil el url de la foto de Google (es un url que hay que subir no un file)
3. Mejorar el sistema de mongodb para que también suban esta foto en el Modelo

## Historias de Usuario

1. Como usuario nuevo, quiero poder registrarme con mi información personal y foto de perfil para tener una cuenta en el sistema.
2. Como usuario, quiero ver una vista previa de mi foto antes de subirla para asegurarme de que es la correcta.
3. Como usuario, quiero recibir confirmación cuando mi registro se complete exitosamente.

## Requisitos Funcionales

### 1. Formulario de Registro

- El sistema debe mostrar un formulario cuando el usuario no existe en MongoDB
- Campos obligatorios:
  - Nombre
  - Apellido
  - Email
  - Foto de perfil
- Campos opcionales:
  - Segundo apellido
  - Teléfono
  - Fecha de nacimiento
  - Género
  - Comunidad

### 2. Manejo de Fotos

- El sistema debe aceptar solo archivos JPG y PNG
- Tamaño máximo de archivo: 5MB
- El sistema debe mostrar una vista previa de la foto antes de subirla
- El sistema debe validar el formato y tamaño del archivo antes de la subida

### 3. Almacenamiento en Google Cloud Storage

- Las fotos deben almacenarse en el bucket `katalyst-profile-photos`
- El nombre del archivo debe incluir el email del usuario y timestamp
- Las URLs de las fotos deben ser públicas y permanentes

### 4. Sincronización con Monday.com

- Todos los campos del formulario deben sincronizarse con Monday.com
- La URL de la foto de perfil debe guardarse en la columna `text_mkqkh24j`
- El sistema debe manejar errores de sincronización sin afectar el registro en MongoDB

### 5. Almacenamiento en MongoDB

- Todos los campos del formulario deben guardarse en MongoDB
- La URL de la foto de perfil debe guardarse en el campo `fotoPerfil`
- El sistema debe encriptar la contraseña antes de guardarla

## Consideraciones Técnicas

### Validaciones

- Validar formato de email
- Validar formato y tamaño de foto
- Validar que el usuario no exista previamente

### Manejo de Errores

- Mostrar mensajes de error claros y específicos
- Mantener los datos del formulario en caso de error
- Implementar reintentos para la sincronización con Monday.com

### Seguridad

- Implementar rate limiting para prevenir abusos
- Validar tipos de archivo en el servidor
- Sanitizar nombres de archivo

## Flujo del Proceso

1. Usuario accede al sistema
2. Sistema verifica si el usuario existe en MongoDB
3. Si no existe, muestra el formulario de registro
4. Usuario completa el formulario y selecciona foto
5. Sistema valida todos los campos
6. Sistema sube la foto a Google Cloud Storage
7. Sistema crea usuarios en monday.com
8. Sistema crea el usuario en MongoDB
9. Sistema envia por medio de nextAuth el correo de verificación de correo.

## Métricas de Éxito

- Tasa de éxito en registros completados
- Tiempo promedio de registro
- Tasa de errores en subida de fotos
- Tasa de errores en sincronización con Monday.com

## Preguntas Abiertas

1. ¿Se debe implementar un sistema de verificación de email? Si

## Notas Adicionales

- Priorizar la experiencia de usuario sobre la velocidad de implementación
- Mantener consistencia en el diseño con el resto de la aplicación
- Implementar logs detallados para facilitar el debugging
