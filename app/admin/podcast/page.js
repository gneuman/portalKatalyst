"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FaArrowLeft,
  FaSync,
  FaEye,
  FaHeart,
  FaInfoCircle,
} from "react-icons/fa";

export default function AdminPodcastPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [mongoStats, setMongoStats] = useState({});
  const [ytStats, setYtStats] = useState({});

  // Función para obtener los items de Monday.com y las estadísticas
  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    setLogs([]);
    setMongoStats({});
    setYtStats({});

    try {
      console.log("[ADMIN-PODCAST] Obteniendo items de Monday.com...");
      addLog("Obteniendo items de Monday.com...");

      // Primero verificar variables de entorno
      addLog("🔍 Verificando variables de entorno...");
      const envResponse = await fetch("/api/podcast/debug-env");
      const envData = await envResponse.json();
      if (envData.success) {
        addLog("✅ Variables de entorno verificadas");
        console.log(
          "[ADMIN-PODCAST] Variables de entorno:",
          envData.environment
        );
        if (envData.environment.MONDAY_API_KEY === "NO CONFIGURADO") {
          throw new Error("MONDAY_API_KEY no está configurado");
        }
        if (envData.environment.MONDAY_PODCAST_BOARD_ID === "NO CONFIGURADO") {
          throw new Error("MONDAY_PODCAST_BOARD_ID no está configurado");
        }
      } else {
        throw new Error("Error verificando variables de entorno");
      }

      // Obtener todos los items del board
      addLog("📋 Obteniendo items de Monday.com...");
      const allItemsResponse = await fetch("/api/podcast/monday/items");
      const allItemsData = await allItemsResponse.json();
      if (allItemsData.success && allItemsData.items) {
        const first5Items = allItemsData.items.slice(0, 5);
        setItems(first5Items);
        addLog(`✅ Obtenidos ${first5Items.length} items de Monday.com`);
        console.log("[ADMIN-PODCAST] Items obtenidos:", first5Items);

        // Obtener videoIds
        const videoIds = first5Items
          .map((item) => {
            const col = item.column_values?.find(
              (col) => col.id === "text_mkshh5"
            );
            return col?.text || null;
          })
          .filter(Boolean);
        addLog(`🔎 Video IDs: ${videoIds.join(", ")}`);

        // Consultar MongoDB
        addLog("🟢 Consultando estadísticas en MongoDB...");
        const mongoRes = await fetch("/api/podcast/mongodb-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoIds }),
        });
        const mongoData = await mongoRes.json();
        if (mongoData.success) {
          setMongoStats(mongoData.stats);
          addLog("✅ Estadísticas de MongoDB obtenidas");
        } else {
          addLog("❌ Error MongoDB: " + mongoData.error);
        }

        // Consultar YouTube
        addLog("🔴 Consultando estadísticas en YouTube...");
        const ytRes = await fetch("/api/podcast/youtube-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoIds }),
        });
        const ytData = await ytRes.json();
        if (ytData.success) {
          setYtStats(ytData.stats);
          addLog("✅ Estadísticas de YouTube obtenidas");
        } else {
          addLog("❌ Error YouTube: " + ytData.error);
        }
      } else {
        throw new Error(
          allItemsData.error || "No se pudieron obtener los items"
        );
      }
    } catch (err) {
      setError(err.message);
      addLog(`❌ Error: ${err.message}`);
      console.error("[ADMIN-PODCAST] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar un item específico
  const updateItem = async (itemId, currentViews, currentLikes) => {
    setUpdating(true);
    setError(null);
    addLog(`🔄 Actualizando item ${itemId}...`);

    try {
      console.log(`[ADMIN-PODCAST] Actualizando item ${itemId}:`, {
        currentViews,
        currentLikes,
        newViews: currentViews + 1000,
        newLikes: currentLikes + 50,
      });

      const response = await fetch("/api/podcast/test-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          views: currentViews + 1000,
          likes: currentLikes + 50,
        }),
      });

      const data = await response.json();

      if (data.success) {
        addLog(`✅ Item ${itemId} actualizado correctamente`);
        console.log("[ADMIN-PODCAST] Respuesta de actualización:", data);
      } else {
        throw new Error(data.error || "Error en la actualización");
      }

      // Refrescar la lista
      await fetchItems();
    } catch (err) {
      setError(err.message);
      addLog(`❌ Error actualizando item ${itemId}: ${err.message}`);
      console.error("[ADMIN-PODCAST] Error actualizando:", err);
    } finally {
      setUpdating(false);
    }
  };

  // Función para agregar logs
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  // Función para sincronización completa
  const syncComplete = async () => {
    setUpdating(true);
    setError(null);
    addLog("🔄 Iniciando sincronización completa...");

    try {
      console.log("[ADMIN-PODCAST] Iniciando sincronización completa...");

      const response = await fetch("/api/podcast/sync-complete", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        addLog(
          `✅ Sincronización completa exitosa: ${data.summary.processed} videos procesados`
        );
        addLog(
          `📊 Resumen: MongoDB=${data.summary.mongoUpdates}, Monday.com=${data.summary.mondayUpdates}, Errores=${data.summary.errors}`
        );
        console.log("[ADMIN-PODCAST] Sincronización completa:", data);
      } else {
        throw new Error(data.error || "Error en sincronización");
      }

      // Refrescar la lista
      await fetchItems();
    } catch (err) {
      setError(err.message);
      addLog(`❌ Error en sincronización: ${err.message}`);
      console.error("[ADMIN-PODCAST] Error en sincronización:", err);
    } finally {
      setUpdating(false);
    }
  };

  // Función para sincronización unificada (nuevo endpoint)
  const syncUnified = async () => {
    setUpdating(true);
    setError(null);
    addLog(
      "🚀 Iniciando sincronización unificada (YouTube → MongoDB → Monday.com)..."
    );

    try {
      console.log("[ADMIN-PODCAST] Iniciando sincronización unificada...");

      const response = await fetch("/api/podcast/sync-complete", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        addLog(`✅ Sincronización unificada exitosa!`);
        addLog(`📊 Videos procesados: ${data.summary.processed}`);
        addLog(`🟢 Actualizaciones MongoDB: ${data.summary.mongoUpdates}`);
        addLog(`🔵 Actualizaciones Monday.com: ${data.summary.mondayUpdates}`);
        addLog(`❌ Errores: ${data.summary.errors}`);

        if (data.logs && data.logs.length > 0) {
          addLog("📝 Logs detallados:");
          data.logs.forEach((log) => addLog(`   ${log}`));
        }

        console.log("[ADMIN-PODCAST] Sincronización unificada:", data);
      } else {
        throw new Error(data.error || "Error en sincronización unificada");
      }

      // Refrescar la lista
      await fetchItems();
    } catch (err) {
      setError(err.message);
      addLog(`❌ Error en sincronización unificada: ${err.message}`);
      console.error("[ADMIN-PODCAST] Error en sincronización unificada:", err);
    } finally {
      setUpdating(false);
    }
  };

  // Cargar items al montar el componente
  useEffect(() => {
    fetchItems();
  }, []);

  const getColumnValue = (item, columnId) => {
    const column = item.column_values?.find((col) => col.id === columnId);
    return column?.text || "0";
  };

  // Nueva función para mostrar la tabla comparativa
  const renderStatsTable = () => {
    if (!items.length) return null;
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow-lg mb-8">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Video</th>
              <th className="px-4 py-2 text-center">Monday.com</th>
              <th className="px-4 py-2 text-center">MongoDB</th>
              <th className="px-4 py-2 text-center">YouTube</th>
            </tr>
            <tr className="bg-gray-50">
              <th></th>
              <th className="px-4 py-2 text-center">👁️ Vistas / ❤️ Likes</th>
              <th className="px-4 py-2 text-center">👁️ Vistas / ❤️ Likes</th>
              <th className="px-4 py-2 text-center">👁️ Vistas / ❤️ Likes</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const videoId =
                item.column_values?.find((col) => col.id === "text_mkshh5")
                  ?.text || "";
              const viewsMonday =
                item.column_values?.find((col) => col.id === "numeric_mkshtg2f")
                  ?.text || "0";
              const likesMonday =
                item.column_values?.find((col) => col.id === "numeric_mkshy1xp")
                  ?.text || "0";
              const fechaPublicacion =
                item.column_values?.find((col) => col.id === "date_mkshy6ck")
                  ?.text || "-";
              const mongo = mongoStats[videoId] || {
                viewCount: "-",
                likeCount: "-",
              };
              const yt = ytStats[videoId] || { viewCount: "-", likeCount: "-" };
              return (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-2">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-xs text-gray-500">ID: {videoId}</div>
                    <div className="text-xs text-gray-500">
                      Fecha Publicación: {fechaPublicacion}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className="font-mono">{viewsMonday}</span> /{" "}
                    <span className="font-mono">{likesMonday}</span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className="font-mono">{mongo.viewCount}</span> /{" "}
                    <span className="font-mono">{mongo.likeCount}</span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className="font-mono">{yt.viewCount}</span> /{" "}
                    <span className="font-mono">{yt.likeCount}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
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
            <div className="p-3 bg-purple-100 rounded-lg">
              <FaEye className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Administración de Podcast
              </h1>
              <p className="text-gray-600">
                Monitoreo y debug de estadísticas de Monday.com
              </p>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={fetchItems}
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
                  <FaSync className="w-4 h-4" />
                  <span>Refrescar Items</span>
                </>
              )}
            </button>

            <button
              onClick={syncComplete}
              disabled={updating}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              {updating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <FaSync className="w-4 h-4" />
                  <span>Sincronización Completa</span>
                </>
              )}
            </button>

            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <FaSync className="w-4 h-4" />
              <span>Reiniciar Servidor</span>
            </button>
          </div>
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

        {/* Items */}
        {items.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Items de Monday.com (Primeros 5)
            </h2>

            <div className="space-y-4">
              {items.map((item, index) => {
                const views = getColumnValue(item, "numeric_mkshtg2f");
                const likes = getColumnValue(item, "numeric_mkshy1xp");
                const videoId = getColumnValue(item, "text_mkshh5");

                return (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {index + 1}. {item.name}
                        </h3>
                        <p className="text-sm text-gray-600">ID: {item.id}</p>
                        <p className="text-sm text-gray-600">
                          Video ID: {videoId}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateItem(item.id, parseInt(views), parseInt(likes))
                        }
                        disabled={updating}
                        className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        {updating ? "Actualizando..." : "Actualizar"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <FaEye className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-900">
                            Vistas
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">
                          {views}
                        </p>
                        <p className="text-xs text-blue-600">
                          Columna: numeric_mkshtg2f
                        </p>
                      </div>

                      <div className="bg-red-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <FaHeart className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-red-900">
                            Likes
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-red-700">
                          {likes}
                        </p>
                        <p className="text-xs text-red-600">
                          Columna: numeric_mkshy1xp
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Logs de Debug
            </h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
            <button
              onClick={() => setLogs([])}
              className="mt-4 text-gray-600 hover:text-gray-800 text-sm"
            >
              Limpiar logs
            </button>
          </div>
        )}

        {/* Tabla comparativa de estadísticas */}
        {renderStatsTable()}
      </div>
    </div>
  );
}
