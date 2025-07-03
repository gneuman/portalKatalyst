"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FaList,
  FaArrowLeft,
  FaSearch,
  FaEdit,
  FaPlus,
  FaEye,
  FaEyeSlash,
  FaInfoCircle,
  FaChevronLeft,
  FaChevronRight,
  FaFolder,
  FaFile,
  FaCalendarAlt,
  FaUser,
  FaTag,
  FaCheck,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";

function MondayItemsContent() {
  const searchParams = useSearchParams();
  const [boardId, setBoardId] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [board, setBoard] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Leer boardId de la URL si está presente
  useEffect(() => {
    const urlBoardId = searchParams.get("boardId");
    if (urlBoardId) {
      setBoardId(urlBoardId);
      // Automáticamente cargar items si se proporciona boardId en la URL
      setTimeout(() => handleGetItems(), 100);
    }
  }, [searchParams]);

  const handleGetItems = async () => {
    if (!boardId.trim()) {
      setError("Por favor ingresa un ID de tabla válido");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/monday/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boardId: boardId.trim(),
          limit: 10,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener los items");
      }

      setItems(data.items || []);
      setBoard(data.board);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setEditMode(true);

    // Preparar datos del formulario
    const initialData = { name: item.name };
    item.column_values?.forEach((col) => {
      if (col.column?.type !== "subitems" && col.column?.type !== "person") {
        initialData[col.id] = col.text || col.value || "";
      }
    });

    setFormData(initialData);
    setShowItemModal(true);
  };

  const handleCreateItem = () => {
    setSelectedItem(null);
    setEditMode(false);
    setFormData({ name: "" });
    setShowItemModal(true);
  };

  const handleSaveItem = async () => {
    setSaving(true);
    try {
      // Aquí implementarías la lógica para guardar/crear el item
      // Por ahora solo cerramos el modal
      setShowItemModal(false);
      setSaving(false);

      // Recargar items
      handleGetItems(currentPage);
    } catch (error) {
      setError(error.message);
      setSaving(false);
    }
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

  const renderColumnValue = (col) => {
    if (!col) return "-";

    switch (col.column?.type) {
      case "status":
        return (
          <span
            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
            style={{
              backgroundColor: `${col.label_style?.color || "#6b7280"}20`,
              color: col.label_style?.color || "#6b7280",
            }}
          >
            {col.text || col.label || "-"}
          </span>
        );
      case "checkbox":
        return col.checked ? (
          <FaCheck className="text-green-600" />
        ) : (
          <FaTimes className="text-red-600" />
        );
      case "date":
        return formatDate(col.date);
      case "numbers":
        return col.number?.toString() || col.text || "-";
      case "subitems":
        return (
          <div className="flex items-center space-x-1">
            <FaFolder className="text-blue-600" />
            <span className="text-sm">{col.display_value || "0 subitems"}</span>
          </div>
        );
      default:
        return col.text || col.value || "-";
    }
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
              <FaList className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestionar Items
              </h1>
              <p className="text-gray-600">
                Lista, edita y crea items en tablas de Monday.com
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de búsqueda */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Obtener Items
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
            <div className="flex items-end space-x-2">
              <button
                onClick={() => handleGetItems()}
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
                    <span>Obtener Items</span>
                  </>
                )}
              </button>
              {items.length > 0 && (
                <button
                  onClick={handleCreateItem}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <FaPlus className="w-4 h-4" />
                  <span>Nuevo Item</span>
                </button>
              )}
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

        {/* Información del board */}
        {board && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {board.name}
                </h2>
                <p className="text-gray-600">
                  ID: {board.id} | {items.length} items mostrados
                </p>
              </div>
              <div className="flex space-x-2">
                <Link
                  href={`/admin/monday/structure?boardId=${board.id}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <FaInfoCircle className="w-4 h-4" />
                  <span>Ver Estructura</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Lista de items */}
        {items.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Item
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Columnas
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Subitems
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
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {item.id}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {item.column_values?.slice(0, 3).map((col) => (
                            <div
                              key={col.id}
                              className="flex items-center space-x-2 text-sm"
                            >
                              <span className="text-lg">
                                {getColumnTypeIcon(col.column?.type)}
                              </span>
                              <span className="font-medium text-gray-700 min-w-[100px] truncate">
                                {col.column?.title}:
                              </span>
                              <span className="text-gray-900 truncate max-w-[150px]">
                                {renderColumnValue(col)}
                              </span>
                            </div>
                          ))}
                          {item.column_values?.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{item.column_values.length - 3} columnas más
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <FaFolder className="text-blue-600" />
                          <span className="text-sm">
                            {item.subitems?.length || 0} subitems
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm space-y-1">
                          <div className="flex items-center space-x-1">
                            <FaCalendarAlt className="text-gray-400" />
                            <span>
                              Actualizado: {formatDate(item.updated_at)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                            title="Editar item"
                          >
                            <FaEdit className="w-4 h-4" />
                            <span>Editar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Página {pagination.page} de items
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleGetItems()}
                    disabled={currentPage <= 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    <FaChevronLeft className="w-3 h-3" />
                    <span>Anterior</span>
                  </button>
                  <button
                    onClick={() => handleGetItems()}
                    disabled={!pagination.hasMore}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    <span>Siguiente</span>
                    <FaChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal para editar/crear item */}
        {showItemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4">
                {editMode ? "Editar Item" : "Crear Nuevo Item"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Item
                  </label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ingresa el nombre del item"
                  />
                </div>

                {/* Aquí se agregarían los campos dinámicos basados en la estructura de la tabla */}
                <div className="text-gray-500 text-sm italic">
                  Los campos adicionales se cargarán basándose en la estructura
                  de la tabla.
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveItem}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck className="w-4 h-4" />
                      <span>Guardar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MondayItemsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando items...</p>
          </div>
        </div>
      }
    >
      <MondayItemsContent />
    </Suspense>
  );
}
