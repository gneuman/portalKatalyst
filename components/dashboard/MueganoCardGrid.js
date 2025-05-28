import { BsArrowRight } from "react-icons/bs";
import CardGrid from "./CardGrid";
import config from "@/config";

export default function MueganoCardGrid({ instances = [], onShowPricing }) {
  const renderCard = (instance) => (
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
            {new Date(instance.createdAt).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
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
  );

  const emptyState = {
    title: "No tienes comunidades aún",
    description:
      "Adquiere tu primer Muegano y comienza a conectar con tu audiencia",
    action: {
      label: "Adquiere tu Muegano",
      onClick: onShowPricing,
    },
  };

  return (
    <CardGrid
      items={instances}
      renderCard={renderCard}
      emptyState={emptyState}
      columns={{ sm: 1, md: 2, lg: 3 }}
    />
  );
}
