"use client";
import { useState } from "react";
import Link from "next/link";
import {
  FaThLarge,
  FaArrowLeft,
  FaSearch,
  FaList,
  FaTable,
  FaEye,
  FaEyeSlash,
  FaInfoCircle,
  FaSpinner,
  FaCalendarAlt,
  FaUser,
  FaCog,
  FaFolder,
  FaUsers,
  FaGlobe,
  FaLock,
  FaUnlock,
} from "react-icons/fa";

export default function MondayBoardsPage() {
  const [loading, setLoading] = useState(false);
  const [boards, setBoards] = useState([]);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleGetBoards = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/monday/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener los boards");
      }

      setBoards(data.boards || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getBoardTypeIcon = (boardKind) => {
    const icons = {
      public: <FaGlobe className="text-green-600" />,
      private: <FaLock className="text-red-600" />,
      share: <FaUnlock className="text-blue-600" />,
    };
    return icons[boardKind] || <FaFolder className="text-gray-600" />;
  };

  const getBoardTypeColor = (boardKind) => {
    const colors = {
      public: "bg-green-100 text-green-800",
      private: "bg-red-100 text-red-800",
      share: "bg-blue-100 text-blue-800",
    };
    return colors[boardKind] || "bg-gray-100 text-gray-800";
  };

  const getBoardStateColor = (state) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      archived: "bg-gray-100 text-gray-800",
      deleted: "bg-red-100 text-red-800",
    };
    return colors[state] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredBoards = boards.filter(
    (board) =>
      board.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      board.id.toString().includes(searchTerm) ||
      (board.description &&
        board.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Volver al Panel de Administración
          </Link>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaThLarge className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Todos los Boards
              </h1>
              <p className="text-gray-600">
                Lista completa de tablas disponibles en Monday.com
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de búsqueda */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Obtener Boards
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-4">
                Obtén una lista completa de todas las tablas a las que tienes
                acceso en Monday.com
              </p>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGetBoards}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    <span>Cargando...</span>
                  </>
                ) : (
                  <>
                    <FaSearch className="w-4 h-4" />
                    <span>Obtener Boards</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
            >
              {showAdvanced ? (
                <FaEyeSlash className="w-4 h-4" />
              ) : (
                <FaEye className="w-4 h-4" />
              )}
              <span>
                {showAdvanced ? "Ocultar" : "Mostrar"} información avanzada
              </span>
            </button>
          </div>

          {showAdvanced && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">
                Información sobre Boards
              </h3>
              <p className="text-sm text-blue-800">
                Los boards son las tablas principales en Monday.com. Cada board
                puede contener múltiples columnas y items. Solo se muestran los
                boards a los que tienes acceso según tus permisos.
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <FaInfoCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filtro de búsqueda */}
        {boards.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Boards
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, ID o descripción..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="text-sm text-gray-600">
                {filteredBoards.length} de {boards.length} boards
              </div>
            </div>
          </div>
        )}

        {/* Lista de boards */}
        {boards.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Board
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Información
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Propietario
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Fechas
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBoards.map((board) => (
                    <tr
                      key={board.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center space-x-2">
                            {getBoardTypeIcon(board.board_kind)}
                            <span>{board.name}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {board.id}
                          </div>
                          {board.description && (
                            <div className="text-sm text-gray-600 mt-1">
                              {board.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBoardTypeColor(
                                board.board_kind
                              )}`}
                            >
                              {board.board_kind}
                            </span>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBoardStateColor(
                                board.state
                              )}`}
                            >
                              {board.state}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <FaCog className="text-gray-400" />
                            <span>{board.columns_count} columnas</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <FaUser className="text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {board.owner?.name || "Sin propietario"}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {board.owner?.id || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm space-y-1">
                          <div className="flex items-center space-x-1">
                            <FaCalendarAlt className="text-gray-400" />
                            <span>
                              Actualizado: {formatDate(board.updated_at)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Link
                            href={`/admin/monday/items?boardId=${board.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                            title="Gestionar items"
                          >
                            <FaList className="w-4 h-4" />
                            <span>Items</span>
                          </Link>
                          <Link
                            href={`/admin/monday/structure?boardId=${board.id}`}
                            className="text-green-600 hover:text-green-800 text-sm flex items-center space-x-1"
                            title="Ver estructura"
                          >
                            <FaTable className="w-4 h-4" />
                            <span>Estructura</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Información adicional */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <FaGlobe className="text-green-600" />
                  <span>
                    Público:{" "}
                    {boards.filter((b) => b.board_kind === "public").length}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaLock className="text-red-600" />
                  <span>
                    Privado:{" "}
                    {boards.filter((b) => b.board_kind === "private").length}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaUnlock className="text-blue-600" />
                  <span>
                    Compartido:{" "}
                    {boards.filter((b) => b.board_kind === "share").length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {!loading && boards.length === 0 && !error && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FaThLarge className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay boards cargados
            </h3>
            <p className="text-gray-600 mb-4">
              Haz clic en "Obtener Boards" para cargar la lista de tablas
              disponibles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
