"use client";

import { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

export default function ProgramasConfiguracion() {
  const [programas, setProgramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState({});

  useEffect(() => {
    async function fetchProgramas() {
      try {
        const res = await fetch("/api/programas");
        const data = await res.json();

        if (data.programas) {
          setProgramas(data.programas);
        }
      } catch (error) {
        console.error("Error al obtener programas:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProgramas();
  }, []);

  const toggleDetails = (programaId) => {
    setShowDetails((prev) => ({
      ...prev,
      [programaId]: !prev[programaId],
    }));
  };

  const getValidationStatus = (programa) => {
    const issues = [];

    // Verificar si tiene board destino
    const boardDestino = programa["Board destino"];
    if (!boardDestino) {
      issues.push("No tiene board destino configurado");
    }

    // Verificar si tiene nombre
    const nombre = programa["Título visible"] || programa.nombre;
    if (!nombre) {
      issues.push("No tiene título visible");
    }

    // Verificar si tiene descripción
    const descripcion = programa["Descripción"];
    if (!descripcion) {
      issues.push("No tiene descripción");
    }

    // Verificar tipo
    const tipo = programa["Tipo"] || "formulario";
    if (!["formulario", "info"].includes(tipo)) {
      issues.push("Tipo inválido (debe ser 'formulario' o 'info')");
    }

    // Verificar ruta destino para tipo info
    if (tipo === "info") {
      const rutaDestino = programa["Ruta destino"];
      if (!rutaDestino) {
        issues.push("Programa tipo 'info' debe tener ruta destino");
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="text-gray-500 mt-2">Cargando programas...</p>
      </div>
    );
  }

  if (programas.length === 0) {
    return (
      <div className="text-center py-8">
        <FaExclamationTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay programas configurados
        </h3>
        <p className="text-gray-600">
          No se encontraron programas en el board de configuración.
        </p>
      </div>
    );
  }

  const validProgramas = programas.filter(
    (p) => getValidationStatus(p).isValid
  );
  const invalidProgramas = programas.filter(
    (p) => !getValidationStatus(p).isValid
  );

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaInfoCircle className="w-5 h-5 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Programas
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {programas.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaCheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Válidos</p>
              <p className="text-2xl font-bold text-green-600">
                {validProgramas.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Con Problemas</p>
              <p className="text-2xl font-bold text-red-600">
                {invalidProgramas.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Programas con problemas */}
      {invalidProgramas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4">
            Programas que necesitan atención
          </h3>
          <div className="space-y-4">
            {invalidProgramas.map((programa, index) => {
              const validation = getValidationStatus(programa);
              return (
                <div
                  key={index}
                  className="bg-white border border-red-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {programa["Título visible"] ||
                          programa.nombre ||
                          "Sin nombre"}
                      </h4>
                      <p className="text-sm text-gray-500">ID: {programa.id}</p>
                    </div>
                    <button
                      onClick={() => toggleDetails(programa.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      {showDetails[programa.id] ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  {showDetails[programa.id] && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-sm font-medium text-red-800 mb-2">
                        Problemas encontrados:
                      </p>
                      <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                        {validation.issues.map((issue, issueIndex) => (
                          <li key={issueIndex}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Programas válidos */}
      {validProgramas.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            Programas correctamente configurados
          </h3>
          <div className="space-y-4">
            {validProgramas.map((programa, index) => (
              <div
                key={index}
                className="bg-white border border-green-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {programa["Título visible"] || programa.nombre}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Tipo: {programa["Tipo"] || "formulario"} | Board:{" "}
                      {programa["Board destino"] || "N/A"}
                    </p>
                    {programa["Descripción"] && (
                      <p className="text-sm text-gray-600 mt-1">
                        {programa["Descripción"]}
                      </p>
                    )}
                  </div>
                  <FaCheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          Criterios de validación
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • <strong>Board destino:</strong> Debe estar configurado para
            programas tipo "formulario"
          </li>
          <li>
            • <strong>Título visible:</strong> Nombre que se muestra en el
            dashboard
          </li>
          <li>
            • <strong>Descripción:</strong> Información del programa para los
            usuarios
          </li>
          <li>
            • <strong>Tipo:</strong> Debe ser "formulario" o "info"
          </li>
          <li>
            • <strong>Ruta destino:</strong> Requerida para programas tipo
            "info"
          </li>
        </ul>
      </div>
    </div>
  );
}
