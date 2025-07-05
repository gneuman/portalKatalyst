"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ActividadesView({ boardId, itemId, boardName }) {
  const { data: session } = useSession();
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchActividades() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/registro/person-status?katalystId=${session?.user?.personalMondayId}&boardId=${boardId}`
        );
        const data = await res.json();

        if (data.success && data.encontrado) {
          setActividades(data.subitems || []);
        } else {
          setError("No se encontraron actividades");
        }
      } catch (err) {
        console.error("Error al obtener actividades:", err);
        setError("Error al cargar las actividades");
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.personalMondayId && boardId) {
      fetchActividades();
    }
  }, [session?.user?.personalMondayId, boardId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">
          <svg
            className="w-12 h-12 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p className="text-lg font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (actividades.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-500 mb-4">
          <svg
            className="w-12 h-12 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-lg font-semibold">
            No hay actividades disponibles
          </p>
          <p className="text-sm">
            Las actividades aparecerán aquí cuando estén disponibles
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Actividades del Programa
            </h2>
            <p className="text-gray-600">{boardName}</p>
          </div>
          <div className="text-sm text-gray-500">
            {actividades.length} actividad{actividades.length !== 1 ? "es" : ""}
          </div>
        </div>

        <div className="space-y-4">
          {actividades.map((actividad, index) => (
            <div
              key={actividad.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {actividad.name}
                  </h3>

                  {/* Mostrar valores de columnas si existen */}
                  {actividad.column_values &&
                    actividad.column_values.length > 0 && (
                      <div className="space-y-2">
                        {actividad.column_values.map((col) => (
                          <div key={col.id} className="text-sm">
                            <span className="font-medium text-gray-700">
                              {col.column?.title}:
                            </span>{" "}
                            <span className="text-gray-600">
                              {col.text || "Sin valor"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                <div className="ml-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Actividad {index + 1}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {process.env.NODE_ENV === "development" && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-600">
          <strong>Debug Info:</strong>
          <br />
          Board ID: {boardId}
          <br />
          Item ID: {itemId}
          <br />
          Actividades encontradas: {actividades.length}
        </div>
      )}
    </div>
  );
}
