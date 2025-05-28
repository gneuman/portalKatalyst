# Guía de Uso del Template de Dashboard

## 📋 Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación](#instalación)
3. [Configuración](#configuración)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Personalización](#personalización)
6. [Componentes](#componentes)
7. [Ejemplos de Uso](#ejemplos-de-uso)
8. [Solución de Problemas](#solución-de-problemas)

## Requisitos Previos

- Node.js 18.x o superior
- npm o yarn
- Git
- Cuenta en GitHub (opcional, para el repositorio)
- Cuenta en MongoDB (o la base de datos que prefieras)
- Cuenta en Google/GitHub para autenticación (opcional)

## Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/tu-usuario/template-dashboard-nextjs.git mi-proyecto
cd mi-proyecto
```

2. Instala las dependencias:

```bash
npm install
# o
yarn install
```

3. Configura las variables de entorno:

```bash
cp .env.example .env.local
```

4. Edita el archivo `.env.local` con tus configuraciones:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secreto-aqui

# Proveedores de Autenticación
GOOGLE_ID=tu-google-client-id
GOOGLE_SECRET=tu-google-client-secret

# Base de Datos
MONGODB_URI=tu-mongodb-uri

# Configuración de la Aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Inicia el servidor de desarrollo:

```bash
npm run dev
# o
yarn dev
```

## Configuración

### 1. Configuración General

Edita el archivo `config.js` para personalizar:

- Nombre de la aplicación
- Descripción
- Dominio
- Características habilitadas
- Configuración de autenticación
- Configuración de la API
- Configuración de la base de datos

### 2. Configuración de Autenticación

1. Configura los proveedores de autenticación en `config.js`
2. Agrega las credenciales en `.env.local`
3. Personaliza las rutas de autenticación según necesites

### 3. Configuración de la Base de Datos

1. Elige tu base de datos preferida
2. Configura la conexión en `.env.local`
3. Actualiza los modelos según tus necesidades

## Estructura del Proyecto

```
├── app/
│   └── dashboard/
│       ├── page.js          # Página principal del dashboard
│       └── example.js       # Ejemplo de uso
├── components/
│   └── dashboard/
│       ├── DashboardLayout.js  # Layout base
│       ├── StatsGrid.js        # Estadísticas
│       ├── CardGrid.js         # Cuadrícula de tarjetas
│       ├── DataTable.js        # Tabla de datos
│       └── [Componentes específicos]/
├── config.js                # Configuración global
└── public/                  # Archivos estáticos
```

## Personalización

### 1. Crear un Nuevo Dashboard

```jsx
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsGrid from "@/components/dashboard/StatsGrid";
import CardGrid from "@/components/dashboard/CardGrid";
import DataTable from "@/components/dashboard/DataTable";

export default function MiDashboard() {
  return (
    <DashboardLayout
      title="Mi Dashboard"
      subtitle="Personaliza tu contenido aquí"
    >
      {/* Estadísticas */}
      <StatsGrid stats={misEstadisticas} />

      {/* Cuadrícula de tarjetas */}
      <CardGrid items={misDatos} renderCard={renderizarTarjeta} />

      {/* Tabla de datos */}
      <DataTable columns={misColumnas} data={misDatos} />
    </DashboardLayout>
  );
}
```

### 2. Personalizar Estadísticas

```jsx
const stats = [
  {
    label: "Total de Usuarios",
    value: 100,
    icon: <FaUsers className="h-6 w-6 text-blue-600" />,
  },
  // Agrega más estadísticas según necesites
];
```

### 3. Personalizar Tarjetas

```jsx
const renderCard = (item) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3>{item.titulo}</h3>
    <p>{item.descripcion}</p>
  </div>
);
```

### 4. Personalizar Tabla

```jsx
const columns = [
  {
    header: "Nombre",
    accessor: "name",
    render: (row) => <span>{row.name}</span>,
  },
  // Agrega más columnas según necesites
];
```

## Componentes

### DashboardLayout

- Layout base con header y contenedor principal
- Personalizable con título y subtítulo
- Incluye manejo de sesión de usuario

### StatsGrid

- Muestra estadísticas en una cuadrícula
- Soporta íconos personalizados
- Diseño responsive

### CardGrid

- Cuadrícula de tarjetas personalizable
- Soporta estado vacío
- Configurable en columnas

### DataTable

- Tabla de datos con soporte para renderizado personalizado
- Ordenamiento y filtrado
- Estado vacío personalizable

## Ejemplos de Uso

### 1. Dashboard Simple

```jsx
export default function DashboardSimple() {
  return (
    <DashboardLayout title="Dashboard Simple">
      <StatsGrid stats={statsBasicos} />
    </DashboardLayout>
  );
}
```

### 2. Dashboard Completo

```jsx
export default function DashboardCompleto() {
  return (
    <DashboardLayout title="Dashboard Completo">
      <StatsGrid stats={statsAvanzados} />
      <CardGrid items={datos} renderCard={renderizarTarjetaCompleja} />
      <DataTable columns={columnasCompletas} data={datos} />
    </DashboardLayout>
  );
}
```

## Solución de Problemas

### Problemas Comunes

1. **Error de Autenticación**

   - Verifica las credenciales en `.env.local`
   - Asegúrate de que las URLs de callback estén configuradas correctamente

2. **Error de Base de Datos**

   - Verifica la URI de conexión
   - Asegúrate de que la base de datos esté accesible

3. **Errores de Renderizado**
   - Verifica que los datos tengan el formato correcto
   - Revisa la consola del navegador para errores específicos

### Recursos Adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de NextAuth.js](https://next-auth.js.org/)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)

## Contribuir

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
