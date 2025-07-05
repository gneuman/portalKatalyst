# Homologación de Monday ID en Portal Katalyst

## Resumen de Cambios Realizados

### Objetivo

Asegurar que **SIEMPRE** se use `session.user.personalMondayId` como el identificador único del usuario en Monday.com en toda la aplicación.

### Convención de Nomenclatura

**En el Frontend:**

- **Variable:** `katalystId`
- **Valor:** `session.user.personalMondayId`
- **Propósito:** Mantener consistencia con la nomenclatura del frontend

**En el Backend:**

- **Campo:** `personalMondayId`
- **Propósito:** Identificador único en Monday.com

### Cambios Principales

#### 1. Dashboard (`app/dashboard/page.js`)

- **Antes:** `const katalystId = session?.user?.katalystId || null;`
- **Después:** `const katalystId = session?.user?.personalMondayId || null;`
- **Propósito:** Usar el campo correcto de la sesión que siempre contiene el ID de Monday

#### 2. ProfileCard (`components/ProfileCard.js`)

- **Antes:** `const mondayId = session.user.personalMondayId || "";`
- **Después:** `const katalystId = session.user.personalMondayId || "";`
- **Propósito:** Usar nomenclatura consistente del frontend

#### 3. ProgramasGrid (`components/dashboard/ProgramasGrid.js`)

- **Comentario agregado:** `katalystId, // En frontend: katalystId = session.user.personalMondayId`
- **Propósito:** Documentar la convención de nomenclatura

### Campo Correcto en NextAuth

En `libs/next-auth.js`, el callback de session carga correctamente:

```javascript
session.user = {
  // ...
  personalMondayId: dbUser.personalMondayId,
  // ...
};
```

### Regla de Oro

**SIEMPRE usar en Frontend:**

```javascript
const katalystId = session?.user?.personalMondayId || null;
```

**NUNCA usar:**

```javascript
const katalystId = session?.user?.katalystId || null; // ❌ Campo inexistente
```

### Componentes Actualizados

1. ✅ `app/dashboard/page.js` - Usa `personalMondayId` con variable `katalystId`
2. ✅ `components/ProfileCard.js` - Usa `personalMondayId` con variable `katalystId`
3. ✅ `components/dashboard/ProgramasGrid.js` - Documentado para usar `personalMondayId`

### Verificación

Para verificar que todo funciona correctamente:

1. **En el Dashboard:** El Katalyst ID se muestra correctamente
2. **En ProfileCard:** El Katalyst ID se muestra en el perfil
3. **En ProgramasGrid:** Las aplicaciones a programas usan el ID correcto
4. **En la consola:** Los logs muestran "Monday ID" en lugar de "Katalyst ID"

### Beneficios

- ✅ **Consistencia:** Todos los componentes usan el mismo campo
- ✅ **Confiabilidad:** El ID siempre estará disponible si el usuario está logueado
- ✅ **Mantenibilidad:** Un solo lugar para obtener el ID de Monday
- ✅ **Debugging:** Logs claros y consistentes
- ✅ **Nomenclatura:** Frontend usa `katalystId`, backend usa `personalMondayId`

### Nota Importante

Si el `personalMondayId` está vacío para un usuario logueado, significa que:

1. El usuario no se sincronizó correctamente con Monday.com
2. Hay un problema en el proceso de registro
3. Se debe revisar la sincronización en el backend

El campo `personalMondayId` **SIEMPRE** debe estar disponible para usuarios válidos logueados.
