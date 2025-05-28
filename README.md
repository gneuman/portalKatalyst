# Template de Dashboard Next.js

Este es un template base para crear dashboards modernos con Next.js, NextAuth y Tailwind CSS.

## Características

- 🎨 Diseño moderno y responsive
- 🔐 Autenticación con NextAuth
- 📊 Componentes reutilizables para dashboards
- 🎯 Estructura modular y escalable
- 🎮 Fácil de personalizar

## Componentes Incluidos

- `DashboardLayout`: Layout base con header y contenedor principal
- `StatsGrid`: Cuadrícula de estadísticas con íconos
- `CardGrid`: Cuadrícula de tarjetas personalizable
- `DataTable`: Tabla de datos con soporte para renderizado personalizado

## Cómo Usar

1. Clona este repositorio:

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

4. Inicia el servidor de desarrollo:

```bash
npm run dev
# o
yarn dev
```

## Estructura del Proyecto

```
├── app/
│   └── dashboard/
│       ├── page.js
│       └── example.js
├── components/
│   └── dashboard/
│       ├── DashboardLayout.js
│       ├── StatsGrid.js
│       ├── CardGrid.js
│       └── DataTable.js
└── public/
```

## Personalización

### 1. Modificar el Layout

```jsx
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function MiDashboard() {
  return (
    <DashboardLayout
      title="Mi Dashboard"
      subtitle="Personaliza tu contenido aquí"
    >
      {/* Tu contenido aquí */}
    </DashboardLayout>
  );
}
```

### 2. Agregar Estadísticas

```jsx
import StatsGrid from "@/components/dashboard/StatsGrid";

const stats = [
  {
    label: "Total",
    value: 100,
    icon: <FaUsers className="h-6 w-6 text-blue-600" />,
  },
];

<StatsGrid stats={stats} />;
```

### 3. Crear una Cuadrícula de Tarjetas

```jsx
import CardGrid from "@/components/dashboard/CardGrid";

<CardGrid
  items={misDatos}
  renderCard={(item) => (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3>{item.titulo}</h3>
    </div>
  )}
/>;
```

### 4. Mostrar una Tabla de Datos

```jsx
import DataTable from "@/components/dashboard/DataTable";

const columns = [
  { header: "Nombre", accessor: "name" },
  {
    header: "Estado",
    accessor: "status",
    render: (row) => <span>{row.status}</span>,
  },
];

<DataTable columns={columns} data={misDatos} keyField="id" />;
```

## Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.

## Licencia

MIT
