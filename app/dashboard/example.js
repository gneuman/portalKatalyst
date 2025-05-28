"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FaUsers, FaComments, FaCalendarAlt } from "react-icons/fa";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsGrid from "@/components/dashboard/StatsGrid";
import CardGrid from "@/components/dashboard/CardGrid";
import DataTable from "@/components/dashboard/DataTable";

export default function ExampleDashboard() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setData([
        { id: 1, name: "Proyecto 1", status: "active", createdAt: new Date() },
        { id: 2, name: "Proyecto 2", status: "pending", createdAt: new Date() },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total de Proyectos",
      value: data.length,
      icon: <FaUsers className="h-6 w-6 text-blue-600" />,
    },
    {
      label: "Proyectos Activos",
      value: data.filter((item) => item.status === "active").length,
      icon: <FaComments className="h-6 w-6 text-green-600" />,
    },
    {
      label: "Proyectos Pendientes",
      value: data.filter((item) => item.status === "pending").length,
      icon: <FaCalendarAlt className="h-6 w-6 text-yellow-600" />,
    },
  ];

  const columns = [
    { header: "Nombre", accessor: "name" },
    {
      header: "Estado",
      accessor: "status",
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {row.status === "active" ? "Activo" : "Pendiente"}
        </span>
      ),
    },
    {
      header: "Fecha de creación",
      accessor: "createdAt",
      render: (row) => new Date(row.createdAt).toLocaleDateString("es-ES"),
    },
  ];

  return (
    <DashboardLayout
      title="Dashboard de Ejemplo"
      subtitle="Gestiona tus proyectos desde aquí"
    >
      {/* Estadísticas */}
      <div className="mb-8">
        <StatsGrid stats={stats} />
      </div>

      {/* Cuadrícula de tarjetas */}
      <div className="mb-8">
        <CardGrid
          items={data}
          renderCard={(item) => (
            <div
              key={item.id}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {item.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Estado: {item.status === "active" ? "Activo" : "Pendiente"}
                </p>
              </div>
            </div>
          )}
          emptyState={{
            title: "No hay proyectos",
            description: "Crea tu primer proyecto para comenzar",
            action: {
              label: "Crear Proyecto",
              onClick: () => console.log("Crear proyecto"),
            },
          }}
        />
      </div>

      {/* Tabla de datos */}
      <div className="mb-8">
        <DataTable
          columns={columns}
          data={data}
          keyField="id"
          onRowClick={(row) => console.log("Click en fila:", row)}
        />
      </div>
    </DashboardLayout>
  );
}
