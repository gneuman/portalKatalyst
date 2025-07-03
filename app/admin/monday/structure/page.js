"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FaTable,
  FaArrowLeft,
  FaSearch,
  FaCopy,
  FaEye,
  FaEyeSlash,
  FaDownload,
  FaInfoCircle,
} from "react-icons/fa";

function MondayStructureContent() {
  const searchParams = useSearchParams();
  const [boardId, setBoardId] = useState("");
  const [loading, setLoading] = useState(false);
  const [structure, setStructure] = useState(null);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Leer boardId de la URL si está presente
  useEffect(() => {
    const urlBoardId = searchParams.get("boardId");
    if (urlBoardId) {
      setBoardId(urlBoardId);
      // Automáticamente cargar estructura si se proporciona boardId en la URL
      handleGetStructureWithBoardId(urlBoardId);
    }
  }, [searchParams]);

  const handleGetStructureWithBoardId = async (boardIdParam) => {
    if (!boardIdParam || !boardIdParam.trim()) {
      setError("Por favor ingresa un ID de tabla válido");
      return;
    }

    setLoading(true);
    setError(null);
    setStructure(null);

    try {
      const response = await fetch("/api/monday/structure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ boardId: boardIdParam.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener la estructura");
      }

      setStructure(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStructure = async () => {
    if (!boardId.trim()) {
      setError("Por favor ingresa un ID de tabla válido");
      return;
    }

    await handleGetStructureWithBoardId(boardId);
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const exportToJSON = () => {
    if (!structure) return;

    const dataStr = JSON.stringify(structure, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `monday-structure-${boardId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getColumnTypeIcon = (type) => {
    const icons = {
      text: "📝",
      long_text: "📄",
      numbers: "🔢",
      status: "🏷️",
      dropdown: "📋",
      date: "📅",
      person: "👤",
      location: "📍",
      phone: "📞",
      email: "📧",
      link: "🔗",
      checkbox: "☑️",
      time_tracking: "⏱️",
      board_relation: "🔗",
      subitems: "📁",
      world_clock: "🌍",
      color_picker: "🎨",
      rating: "⭐",
      timeline: "📊",
      file: "📎",
      multiple_person: "👥",
      country: "🌍",
      week: "📅",
      hour: "🕐",
      color: "🎨",
      button: "🔘",
      integration: "🔌",
      dependency: "🔗",
      formula: "🧮",
      last_updated: "🕒",
      created_at: "📅",
      creator: "👤",
      last_updated_by: "👤",
      mirror: "🪞",
      auto_number: "🔢",
      progress: "📊",
      time: "🕐",
      vote: "🗳️",
      tags: "🏷️",
      item_id: "🆔",
      board_relation_mkrcrrm: "🔗",
    };
    return icons[type] || "❓";
  };

  const getColumnTypeColor = (type) => {
    const colors = {
      text: "bg-blue-100 text-blue-800",
      long_text: "bg-purple-100 text-purple-800",
      numbers: "bg-green-100 text-green-800",
      status: "bg-yellow-100 text-yellow-800",
      dropdown: "bg-indigo-100 text-indigo-800",
      date: "bg-red-100 text-red-800",
      person: "bg-pink-100 text-pink-800",
      location: "bg-orange-100 text-orange-800",
      phone: "bg-teal-100 text-teal-800",
      email: "bg-cyan-100 text-cyan-800",
      link: "bg-blue-100 text-blue-800",
      checkbox: "bg-green-100 text-green-800",
      time_tracking: "bg-gray-100 text-gray-800",
      board_relation: "bg-purple-100 text-purple-800",
      subitems: "bg-indigo-100 text-indigo-800",
      world_clock: "bg-yellow-100 text-yellow-800",
      color_picker: "bg-pink-100 text-pink-800",
      rating: "bg-orange-100 text-orange-800",
      timeline: "bg-red-100 text-red-800",
      file: "bg-gray-100 text-gray-800",
      multiple_person: "bg-blue-100 text-blue-800",
      country: "bg-green-100 text-green-800",
      week: "bg-purple-100 text-purple-800",
      hour: "bg-yellow-100 text-yellow-800",
      color: "bg-pink-100 text-pink-800",
      button: "bg-gray-100 text-gray-800",
      integration: "bg-indigo-100 text-indigo-800",
      dependency: "bg-orange-100 text-orange-800",
      formula: "bg-teal-100 text-teal-800",
      last_updated: "bg-cyan-100 text-cyan-800",
      created_at: "bg-blue-100 text-blue-800",
      creator: "bg-green-100 text-green-800",
      last_updated_by: "bg-purple-100 text-purple-800",
      mirror: "bg-yellow-100 text-yellow-800",
      auto_number: "bg-pink-100 text-pink-800",
      progress: "bg-red-100 text-red-800",
      time: "bg-gray-100 text-gray-800",
      vote: "bg-indigo-100 text-indigo-800",
      tags: "bg-orange-100 text-orange-800",
      item_id: "bg-teal-100 text-teal-800",
      board_relation_mkrcrrm: "bg-cyan-100 text-cyan-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

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
              <FaTable className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Explorar Estructura de Tabla
              </h1>
              <p className="text-gray-600">
                Visualiza todos los campos y columnas de una tabla de Monday.com
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de búsqueda */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Obtener Estructura
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID de la Tabla (Board ID)
              </label>
              <input
                type="text"
                value={boardId}
                onChange={(e) => setBoardId(e.target.value)}
                placeholder="Ej: 1234567890"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGetStructure}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Cargando...</span>
                  </>
                ) : (
                  <>
                    <FaSearch className="w-4 h-4" />
                    <span>Obtener Estructura</span>
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
                Información del Board ID
              </h3>
              <p className="text-sm text-blue-800">
                El Board ID se puede encontrar en la URL de Monday.com cuando
                estás en la tabla. Por ejemplo:{" "}
                <code className="bg-blue-100 px-1 rounded">
                  https://monday.com/boards/1234567890
                </code>
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

        {/* Resultados */}
        {structure && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Estructura de la Tabla
                </h2>
                <p className="text-gray-600">
                  {structure.board?.name} (ID: {boardId})
                </p>
              </div>
              <button
                onClick={exportToJSON}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <FaDownload className="w-4 h-4" />
                <span>Exportar JSON</span>
              </button>
            </div>

            {/* Información del board */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-1">Nombre</h3>
                <p className="text-gray-600">
                  {structure.board?.name || "N/A"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-1">Tipo</h3>
                <p className="text-gray-600">
                  {structure.board?.board_kind || "N/A"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-1">Columnas</h3>
                <p className="text-gray-600">
                  {structure.columns?.length || 0}
                </p>
              </div>
            </div>

            {/* Tabla de columnas */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Columna
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Tipo
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      ID
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Configuración
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {structure.columns?.map((column, index) => (
                    <tr
                      key={column.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {getColumnTypeIcon(column.type)}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900">
                              {column.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {column.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getColumnTypeColor(
                            column.type
                          )}`}
                        >
                          {column.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {column.id}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {column.settings_str ? (
                            <details className="cursor-pointer">
                              <summary className="hover:text-gray-900">
                                Ver configuración
                              </summary>
                              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-w-xs">
                                {JSON.stringify(
                                  JSON.parse(column.settings_str),
                                  null,
                                  2
                                )}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-gray-400">
                              Sin configuración
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              copyToClipboard(column.id, `id-${column.id}`)
                            }
                            className="text-blue-600 hover:text-blue-800 text-sm"
                            title="Copiar ID"
                          >
                            {copiedField === `id-${column.id}` ? (
                              "✓"
                            ) : (
                              <FaCopy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                column.title,
                                `title-${column.id}`
                              )
                            }
                            className="text-green-600 hover:text-green-800 text-sm"
                            title="Copiar título"
                          >
                            {copiedField === `title-${column.id}` ? (
                              "✓"
                            ) : (
                              <FaCopy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MondayStructurePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando estructura...</p>
          </div>
        </div>
      }
    >
      <MondayStructureContent />
    </Suspense>
  );
}
