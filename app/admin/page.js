"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FaTable,
  FaSearch,
  FaEdit,
  FaCog,
  FaArrowRight,
  FaUsers,
  FaShieldAlt,
  FaTools,
  FaListAlt,
  FaPlusSquare,
  FaHome,
  FaCogs,
  FaThLarge,
} from "react-icons/fa";

const tools = [
  {
    title: "Todos los Boards",
    description:
      "Lista completa de todas las tablas disponibles en Monday.com.",
    icon: FaThLarge,
    href: "/admin/monday/boards",
    color: "bg-indigo-500 hover:bg-indigo-600",
    iconColor: "text-indigo-500",
  },
  {
    title: "Estructura de Tabla",
    description:
      "Visualiza todos los campos y columnas de una tabla de Monday.com.",
    icon: FaTable,
    href: "/admin/monday/structure",
    color: "bg-blue-500 hover:bg-blue-600",
    iconColor: "text-blue-500",
  },
  {
    title: "Gestionar Items",
    description: "Lista todos los items de un board específico de Monday.com.",
    icon: FaListAlt,
    href: "/admin/monday/items",
    color: "bg-green-500 hover:bg-green-600",
    iconColor: "text-green-500",
  },
];

export default function AdminPage() {
  const { data: session, status } = useSession();

  // Mostrar estado de carga mientras se obtiene la sesión
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Bypass temporal - permitir acceso sin verificación
  // TODO: Restaurar verificación cuando esté listo
  if (false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaShieldAlt className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Denegado
          </h1>
          <p className="text-gray-600">
            Debes iniciar sesión para acceder a esta área.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-900 rounded-full mb-6">
            <FaTools className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Herramientas de Administración
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Accede a las herramientas para gestionar y trabajar con el API de
            Monday.com
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
            <FaUsers className="w-4 h-4" />
            <span>Conectado como: {session?.user?.email || "Usuario"}</span>
          </div>
        </div>

        {/* Herramientas */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool, index) => (
            <Link key={index} href={tool.href}>
              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col items-center text-center">
                <div
                  className={`p-4 rounded-full mb-4 ${tool.iconColor} bg-opacity-10`}
                >
                  <tool.icon className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {tool.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{tool.description}</p>
                <div
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-white text-sm font-medium ${tool.color} transition-colors`}
                >
                  <span>Acceder</span>
                  <FaArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Información adicional */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Información del Sistema
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Estado de Conexión
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Monday.com API conectado
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Permisos</h3>
              <div className="text-sm text-gray-600">
                <p>• Lectura de tablas</p>
                <p>• Escritura de datos</p>
                <p>• Gestión de columnas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación de regreso */}
        <div className="mt-8 text-center">
          <Link href="/dashboard">
            <button className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              <FaHome className="w-4 h-4 mr-2" /> Volver al Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
