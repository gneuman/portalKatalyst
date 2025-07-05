import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function ProgramasHistorial() {
  const { data: session } = useSession();
  const [aplicaciones, setAplicaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAplicaciones() {
      if (!session?.user?.personalMondayId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/usuario/mis-programas?katalystId=${session.user.personalMondayId}`
        );
        const data = await res.json();

        if (data.success) {
          setAplicaciones(data.programas || []);
        }
      } catch (error) {
        console.error("Error al obtener aplicaciones:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAplicaciones();
  }, [session?.user?.personalMondayId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Mis Programas</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-500 mt-2">Cargando...</p>
        </div>
      </div>
    );
  }

  if (aplicaciones.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Mis Programas</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">Aún no has aplicado a ningún programa</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "aceptado":
      case "aprobado":
        return "bg-green-100 text-green-800";
      case "rechazado":
        return "bg-red-100 text-red-800";
      case "en revisión":
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold mb-6">Mis Programas</h3>
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Programa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {aplicaciones.map((app, index) => {
              // Calcular acciones y avance
              const totalSubitems = app.subitems ? app.subitems.length : 0;
              const completados = app.subitems
                ? app.subitems.filter((sub) => {
                    const statusCol = sub.column_values?.find(
                      (col) =>
                        col.column?.type === "status" ||
                        col.column?.title?.toLowerCase().includes("status") ||
                        col.column?.title?.toLowerCase().includes("estado")
                    );
                    return (
                      statusCol &&
                      [
                        "hecho",
                        "completado",
                        "finalizado",
                        "done",
                        "completo",
                        "terminado",
                        "listo",
                        "aprobado",
                        "aceptado",
                      ].includes((statusCol.text || "").toLowerCase())
                    );
                  }).length
                : 0;
              const avance =
                totalSubitems > 0
                  ? Math.round((completados / totalSubitems) * 100)
                  : 0;
              return (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {app.programaNombre}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        app.status
                      )}`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {totalSubitems} acciones
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {totalSubitems > 0 ? (
                      <span>{avance}%</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
