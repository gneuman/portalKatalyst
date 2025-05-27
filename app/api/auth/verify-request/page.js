"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FaEnvelope } from "react-icons/fa";

function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <FaEnvelope className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Revisa tu correo
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Te hemos enviado un enlace mágico a {email}
            </p>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Consejos para encontrar el correo
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="text-sm text-gray-600">
                <p className="font-medium">Para Gmail:</p>
                <ul className="list-disc list-inside mt-2">
                  <li>
                    Revisa la carpeta de &quot;Promociones&quot; o
                    &quot;Social&quot;
                  </li>
                  <li>Busca en el spam</li>
                  <li>
                    Usa el filtro &quot;from:resend.com&quot; en la búsqueda
                  </li>
                </ul>
              </div>

              <div className="text-sm text-gray-600">
                <p className="font-medium">Para Outlook:</p>
                <ul className="list-disc list-inside mt-2">
                  <li>
                    Revisa la carpeta de &quot;Otros&quot; o &quot;Foco&quot;
                  </li>
                  <li>Busca en la carpeta de correo no deseado</li>
                  <li>
                    Usa el filtro &quot;from:resend.com&quot; en la búsqueda
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyRequest() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <VerifyRequestContent />
    </Suspense>
  );
}
