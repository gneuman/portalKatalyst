"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FaHeart,
  FaCheckCircle,
  FaEnvelope,
  FaHome,
  FaUsers,
} from "react-icons/fa";

export default function GraciasPage() {
  const searchParams = useSearchParams();
  const [donationInfo, setDonationInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (sessionId) {
      // Obtener información de la donación
      fetchDonationInfo(sessionId);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const fetchDonationInfo = async (sessionId) => {
    try {
      const response = await fetch("/api/stripe/donation-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        setDonationInfo(data);
      }
    } catch (error) {
      console.error("Error al obtener información de la donación:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Cargando información de tu donación...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <FaCheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Gracias por tu donación!
          </h1>
          <p className="text-lg text-gray-600">
            Tu generosidad nos ayuda a continuar guiando a las personas a
            alcanzar su máximo potencial a través de la sustentabilidad
            económica.
          </p>
        </div>

        {/* Información de la donación */}
        {donationInfo && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Detalles de tu donación
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Donador:</span>
                <span className="font-medium">{donationInfo.donorName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{donationInfo.donorEmail}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Tipo:</span>
                <span className="font-medium">
                  {donationInfo.type === "one-time"
                    ? "Donación única"
                    : "Donación mensual"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Monto:</span>
                <span className="font-medium text-green-600">
                  ${donationInfo.amount} MXN
                  {donationInfo.type === "recurring" && "/mes"}
                </span>
              </div>
              {donationInfo.message && (
                <div className="py-2">
                  <span className="text-gray-600 block mb-2">Mensaje:</span>
                  <p className="text-gray-900 italic">
                    "{donationInfo.message}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ¿Qué sigue?
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <FaEnvelope className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900">
                  Recibirás un email de confirmación
                </h3>
                <p className="text-sm text-gray-600">
                  Te enviaremos un recibo por email con todos los detalles de tu
                  donación.
                </p>
              </div>
            </div>
            {donationInfo?.type === "recurring" && (
              <div className="flex items-start space-x-3">
                <FaCalendarAlt className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    Donación recurrente activada
                  </h3>
                  <p className="text-sm text-gray-600">
                    Tu donación se procesará automáticamente cada mes. Puedes
                    cancelar en cualquier momento.
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start space-x-3">
              <FaUsers className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900">
                  Únete a nuestra comunidad
                </h3>
                <p className="text-sm text-gray-600">
                  Te mantendremos informado sobre el impacto de tu donación y
                  las novedades del proyecto.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Impacto */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-6 mb-8 text-white">
          <div className="text-center">
            <FaHeart className="w-8 h-8 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Tu donación hace la diferencia
            </h2>
            <p className="text-red-100">
              Con tu apoyo, podemos continuar desarrollando programas de
              sustentabilidad económica y desarrollo personal para más personas.
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <button className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
              <FaHome className="w-4 h-4" />
              Ir al inicio
            </button>
          </Link>
          <Link href="/donar">
            <button className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
              <FaHeart className="w-4 h-4" />
              Hacer otra donación
            </button>
          </Link>
        </div>

        {/* Información de contacto */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            ¿Tienes preguntas sobre tu donación?{" "}
            <a
              href="mailto:donaciones@katalyst.org.mx"
              className="text-red-600 hover:text-red-700"
            >
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
