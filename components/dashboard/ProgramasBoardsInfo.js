"use client";

import { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaEye,
  FaEyeSlash,
  FaCog,
} from "react-icons/fa";

export default function ProgramasBoardsInfo() {
  const [boardsInfo, setBoardsInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState({});
  const [filterStatus, setFilterStatus] = useState("all"); // all, valid, invalid

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

  const toggleDetails = (boardId) => {
    setShowDetails((prev) => ({
      ...prev,
      [boardId]: !prev[boardId],
    }));
  };

  const filteredBoards = boardsInfo.filter((board) => {
    if (filterStatus === "valid") return board.estructuraValida;
    if (filterStatus === "invalid") return !board.estructuraValida;
    return true;
  });

  const stats = {
    total: boardsInfo.length,
    valid: boardsInfo.filter((b) => b.estructuraValida).length,
    invalid: boardsInfo.filter((b) => !b.estructuraValida).length,
    withContact: boardsInfo.filter((b) => b.tieneContacto).length,
    withStatus: boardsInfo.filter((b) => b.tieneStatus).length,
  };

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
          <FaExclamationTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            No hay boards de programas configurados
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaInfoCircle className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-800">Total</p>
              <p className="text-xl font-bold text-blue-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaCheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-green-800">Válidos</p>
              <p className="text-xl font-bold text-green-900">{stats.valid}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-red-800">Con Problemas</p>
              <p className="text-xl font-bold text-red-900">{stats.invalid}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaCog className="w-5 h-5 text-purple-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-purple-800">
                Con Contacto
              </p>
              <p className="text-xl font-bold text-purple-900">
                {stats.withContact}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaCog className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Con Status</p>
              <p className="text-xl font-bold text-yellow-900">
                {stats.withStatus}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filterStatus === "all"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Todos ({stats.total})
        </button>
        <button
          onClick={() => setFilterStatus("valid")}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filterStatus === "valid"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Válidos ({stats.valid})
        </button>
        <button
          onClick={() => setFilterStatus("invalid")}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filterStatus === "invalid"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Con Problemas ({stats.invalid})
        </button>
      </div>

      {/* Lista de Boards */}
      <div className="space-y-4">
        {filteredBoards.map((board, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${
              board.estructuraValida
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{board.name}</h4>
                <p className="text-sm text-gray-500">ID: {board.id}</p>
                {board.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {board.description}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-4">
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
                <button
                  onClick={() => toggleDetails(board.id)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  {showDetails[board.id] ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {!board.estructuraValida && (
              <div className="bg-red-100 border border-red-200 rounded p-3 mb-3">
                <p className="text-sm text-red-800">
                  <strong>Configuración incompleta:</strong>
                  {!board.tieneContacto && " Falta columna de contacto. "}
                  {!board.tieneStatus && " Falta columna de status. "}
                </p>
              </div>
            )}

            {showDetails[board.id] && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">
                  Columnas configuradas ({board.columnas.length}):
                </p>
                <div className="flex flex-wrap gap-1">
                  {board.columnas.map((col, colIndex) => (
                    <span
                      key={colIndex}
                      className={`px-2 py-1 text-xs rounded ${
                        col.title.toLowerCase().includes("contacto") ||
                        col.title.toLowerCase().includes("status")
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {col.title} ({col.type})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Información de ayuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          Requisitos para boards de programas
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • <strong>Columna de Contacto:</strong> Para vincular usuarios con
            MondayId
          </li>
          <li>
            • <strong>Columna de Status:</strong> Para gestionar el estado de
            las aplicaciones
          </li>
          <li>
            • <strong>Estructura válida:</strong> Ambos campos son requeridos
            para funcionar correctamente
          </li>
        </ul>
      </div>
    </div>
  );
}
