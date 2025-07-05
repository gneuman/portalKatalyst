import { useState, useEffect } from "react";

export default function ProgramasBoardsInfo() {
  const [boardsInfo, setBoardsInfo] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBoardsInfo() {
      try {
        const res = await fetch("/api/registro/boards");
        const data = await res.json();

        if (data.success) {
          setBoardsInfo(data.boards || []);
        }
      } catch (error) {
        console.error("Error al obtener información de boards:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBoardsInfo();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          Configuración de Programas
        </h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-500 mt-2">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (boardsInfo.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          Configuración de Programas
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">
            No hay boards de programas configurados
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold mb-6">Configuración de Programas</h3>
      <div className="space-y-4">
        {boardsInfo.map((board, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium text-gray-900">{board.name}</h4>
                <p className="text-sm text-gray-500">ID: {board.id}</p>
                {board.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {board.description}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    board.tieneContacto
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {board.tieneContacto ? "✓ Contacto" : "✗ Contacto"}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    board.tieneStatus
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {board.tieneStatus ? "✓ Status" : "✗ Status"}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    board.estructuraValida
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {board.estructuraValida ? "Listo" : "Incompleto"}
                </span>
              </div>
            </div>

            {!board.estructuraValida && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Configuración incompleta:</strong>
                  {!board.tieneContacto && " Falta columna de contacto. "}
                  {!board.tieneStatus && " Falta columna de status. "}
                </p>
              </div>
            )}

            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">
                Columnas configuradas:
              </p>
              <div className="flex flex-wrap gap-1">
                {board.columnas.map((col, colIndex) => (
                  <span
                    key={colIndex}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {col.title} ({col.type})
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
