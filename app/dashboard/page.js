"use client";
import { FaBuilding, FaUser, FaBook, FaClock } from "react-icons/fa";

export default function Dashboard() {
  // KPIs de ejemplo (puedes conectar estos valores a tu backend o lógica real)
  const kpis = [
    {
      label: "Empresas",
      value: 5,
      icon: <FaBuilding className="text-yellow-600 w-8 h-8" />,
    },
    {
      label: "Personas",
      value: 42,
      icon: <FaUser className="text-green-600 w-8 h-8" />,
    },
    {
      label: "Cursos",
      value: 12,
      icon: <FaBook className="text-blue-600 w-8 h-8" />,
    },
    {
      label: "Horas atendidas",
      value: 87,
      icon: <FaClock className="text-purple-600 w-8 h-8" />,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">Resumen</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded shadow p-6 flex flex-col items-center"
          >
            {kpi.icon}
            <div className="text-3xl font-extrabold mt-2">{kpi.value}</div>
            <div className="text-gray-600 mt-1 text-lg">{kpi.label}</div>
          </div>
        ))}
      </div>
      <div className="text-center text-gray-400">
        Selecciona una sección en el menú lateral para ver más detalles.
      </div>
    </div>
  );
}
