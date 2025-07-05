"use client";

import { useState, useEffect } from "react";
import { FaArrowLeft, FaCog, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import Link from "next/link";
import ProgramasBoardsInfo from "@/components/dashboard/ProgramasBoardsInfo";
import ProgramasConfiguracion from "@/components/admin/ProgramasConfiguracion";

export default function AdminProgramasPage() {
  const [activeTab, setActiveTab] = useState("configuracion");
  const [loading, setLoading] = useState(false);

  const tabs = [
    {
      id: "configuracion",
      name: "Configuración de Boards",
      icon: FaCog,
      description: "Revisar estructura y configuración de boards de programas"
    },
    {
      id: "validacion",
      name: "Validación de Programas",
      icon: FaCheckCircle,
      description: "Verificar que los programas estén correctamente configurados"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
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
              <FaCog className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Administración de Programas
              </h1>
              <p className="text-gray-600">
                Revisar y configurar boards de programas en Monday.com
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-lg">
          {activeTab === "configuracion" && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Configuración de Boards de Programas
                </h2>
                <p className="text-gray-600">
                  Revisa la estructura y configuración de los boards que están configurados como programas.
                </p>
              </div>
              <ProgramasBoardsInfo />
            </div>
          )}

          {activeTab === "validacion" && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Validación de Programas
                </h2>
                <p className="text-gray-600">
                  Verifica que todos los programas estén correctamente configurados y funcionando.
                </p>
              </div>
              <ProgramasConfiguracion />
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <FaInfoCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                Información sobre la configuración
              </h3>
              <p className="text-sm text-blue-800">
                Los boards de programas deben tener columnas específicas para funcionar correctamente:
                <strong> Contacto</strong> (para vincular usuarios) y <strong>Status</strong> (para el estado de la aplicación).
                Si algún board aparece como "Incompleto", revisa que tenga estas columnas configuradas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
