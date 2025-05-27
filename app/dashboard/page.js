"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import ButtonAccount from "@/components/ButtonAccount";
import Pricing from "@/components/Pricing";
import { FaUsers, FaComments, FaCalendarAlt } from "react-icons/fa";
import { MdPendingActions } from "react-icons/md";
import { BsArrowRight } from "react-icons/bs";
import config from "@/config";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      console.log(
        "[DASHBOARD] Sesión completa:",
        JSON.stringify(session, null, 2)
      );
      console.log("[DASHBOARD] User ID:", session.user.id);
      // Buscar instancias por userId directamente
      fetchUserInstancesByUserId(session.user.id);
    } else if (status === "authenticated") {
      console.log(
        "[DASHBOARD] Sesión sin ID:",
        JSON.stringify(session, null, 2)
      );
      setInstances([]);
      setLoading(false);
    }
  }, [status, session]);

  const fetchUserInstancesByUserId = async (userId) => {
    try {
      if (!userId) {
        console.log("[DASHBOARD] No hay userId, retornando array vacío");
        setInstances([]);
        setLoading(false);
        return;
      }
      console.log("[DASHBOARD] Buscando instancias para userId:", userId);
      const response = await fetch(`/api/instances?userId=${userId}`);
      const data = await response.json();
      console.log(
        "[DASHBOARD] Respuesta de instancias:",
        JSON.stringify(data, null, 2)
      );
      setInstances(data);
    } catch (error) {
      console.error("[DASHBOARD] Error fetching user instances:", error);
      setInstances([]);
    } finally {
      setLoading(false);
    }
  };

  // Aseguramos que instances sea un array
  const userInstances = Array.isArray(instances) ? instances : [];

  const stats = {
    total: userInstances.length,
    active: userInstances.filter((i) => i.status === "active").length,
    pending: userInstances.filter((i) => i.status === "pending").length,
  };

  // Mostrar el botón solo si el usuario no tiene instancias en su array o si el array es undefined
  console.log("instances:", session?.user?.instances);
  const showBuyButton = stats.total !== 0;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Necesitas iniciar sesión
          </h1>
          <p className="text-gray-600 mb-6">
            Por favor, inicia sesión para acceder a tu dashboard
          </p>
          <button
            onClick={() => signIn()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal de Pricing */}
      {showPricing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => setShowPricing(false)}
              aria-label="Cerrar"
            >
              &times;
            </button>
            <Pricing />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ¡Hola, {session.user?.name || session.user?.email || "Muegano"}!
              </h1>
              {/* DEBUG: Mostrar toda la info del usuario 
              <pre className="bg-gray-100 text-xs p-2 rounded mt-2 text-left overflow-x-auto">
                {JSON.stringify(session.user, null, 2)}
              </pre>
              */}
              <p className="mt-1 text-sm text-gray-500">
                Gestiona tus comunidades desde aquí
              </p>
            </div>
            <div className="flex space-x-4">
              <ButtonAccount session={session} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaUsers className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Comunidades
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.total}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaComments className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Comunidades Activas
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.active}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MdPendingActions className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Comunidades Pendientes
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.pending}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instances Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* DEBUG: Mostrar toda la info de las instancias */}
        <pre className="bg-gray-100 text-xs p-2 rounded mt-2 text-left overflow-x-auto">
          {JSON.stringify(userInstances, null, 2)}
        </pre>

        {userInstances.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <FaUsers className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes comunidades aún
            </h3>
            <p className="text-gray-500 mb-6">
              Adquiere tu primer Muegano y comienza a conectar con tu audiencia
            </p>
            <button
              onClick={() => setShowPricing(true)}
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Adquiere tu Muegano
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {userInstances.map((instance) => (
              <div
                key={instance._id}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {instance.nombre_instancia || "-"}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        instance.status === "active"
                          ? "bg-green-100 text-green-800"
                          : instance.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : instance.status === "suspended"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {instance.status === "active"
                        ? "Activa"
                        : instance.status === "pending"
                        ? "Pendiente"
                        : instance.status === "suspended"
                        ? "Suspendida"
                        : instance.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    <p>
                      Creada el{" "}
                      {new Date(instance.createdAt).toLocaleDateString(
                        "es-ES",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <a
                      href={`https://${instance.nombre_instancia || "-"}.${
                        config.domainName
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={instance.status === "pending"}
                      style={
                        instance.status === "pending"
                          ? { pointerEvents: "none", opacity: 0.5 }
                          : {}
                      }
                    >
                      Visitar
                      <BsArrowRight className="ml-2 h-4 w-4" />
                    </a>
                    <a
                      href={`https://${instance.nombre_instancia || "-"}.${
                        config.domainName
                      }/admin`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={instance.status === "pending"}
                      style={
                        instance.status === "pending"
                          ? { pointerEvents: "none", opacity: 0.5 }
                          : {}
                      }
                    >
                      Administrar
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabla de instancias */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {userInstances.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre Instancia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID WordPress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Instancia
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userInstances.map((instance) => (
                  <tr key={instance._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {instance.nombre_instancia || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {instance.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(instance.createdAt).toLocaleString("es-ES")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {instance.wordpressInstanceId || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {instance._id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Botón para comprar nueva instancia */}
      {showBuyButton && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <button
            onClick={() => setShowPricing(true)}
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Adquiere tu Muegano
          </button>
        </div>
      )}
    </div>
  );
}
