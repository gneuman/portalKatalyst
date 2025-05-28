"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import ButtonAccount from "@/components/ButtonAccount";
import Pricing from "@/components/Pricing";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import MueganoStats from "@/components/dashboard/MueganoStats";
import MueganoCardGrid from "@/components/dashboard/MueganoCardGrid";
import MueganoDataTable from "@/components/dashboard/MueganoDataTable";

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
    <DashboardLayout
      title={`¡Hola, ${
        session.user?.name || session.user?.email || "Usuario"
      }!`}
      subtitle="Bienvenido a Muegano"
    >
      {/* Modal de Pricing */}
      {showPricing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-4 relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl z-10"
              onClick={() => setShowPricing(false)}
              aria-label="Cerrar"
            >
              &times;
            </button>
            <div className="mt-4">
              <Pricing />
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="mb-8">
        <MueganoStats instances={instances} />
      </div>

      {/* Cuadrícula de tarjetas */}
      <div className="mb-8">
        <MueganoCardGrid
          instances={instances}
          onShowPricing={() => setShowPricing(true)}
        />
      </div>

      {/* Tabla de datos */}
      <div className="mb-8">
        <MueganoDataTable instances={instances} />
      </div>

      {/* Botón para comprar nueva instancia */}
      {instances.length > 0 && (
        <div className="text-center">
          <button
            onClick={() => setShowPricing(true)}
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Adquiere tu Muegano
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
