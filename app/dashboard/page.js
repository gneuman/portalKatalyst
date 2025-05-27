"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ButtonCheckout from "@/components/ButtonCheckout";
import config from "@/config";

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchInstances();
    }
  }, [session]);

  const fetchInstances = async () => {
    try {
      const response = await fetch("/api/instances");
      const data = await response.json();
      setInstances(data);
    } catch (error) {
      console.error("Error al cargar las instancias:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    router.push("/api/auth/signin");
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mis Comunidades</h1>
        <ButtonCheckout
          priceId={config.stripe.plans[0].priceId}
          mode="subscription"
          buttonText="Crear nueva comunidad"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : instances.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">
            No tienes comunidades aún
          </h2>
          <p className="text-gray-600 mb-8">
            Crea tu primera comunidad y comienza a conectar con tu audiencia.
          </p>
          <ButtonCheckout
            priceId={config.stripe.plans[0].priceId}
            mode="subscription"
            buttonText="Crear mi primera comunidad"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instances.map((instance) => (
            <div
              key={instance._id}
              className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <div className="card-body">
                <h2 className="card-title">
                  {instance.subdomain}.{config.domainName}
                </h2>
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={`badge ${
                      instance.status === "active"
                        ? "badge-success"
                        : instance.status === "pending"
                        ? "badge-warning"
                        : "badge-error"
                    }`}
                  >
                    {instance.status === "active"
                      ? "Activa"
                      : instance.status === "pending"
                      ? "Pendiente"
                      : "Suspendida"}
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Creada el{" "}
                  {new Date(instance.createdAt).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <div className="card-actions justify-end mt-4">
                  <a
                    href={`https://${instance.subdomain}.${config.domainName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    Visitar comunidad
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
