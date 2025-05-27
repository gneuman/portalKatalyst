"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FaEnvelope, FaExclamationTriangle } from "react-icons/fa";
import { signIn } from "next-auth/react";

function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const handleResendEmail = async () => {
    try {
      await signIn("email", {
        email,
        callbackUrl: "/dashboard",
        redirect: false,
      });
    } catch (error) {
      console.error("Error al reenviar el correo:", error);
    }
  };

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
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Si no recibes el correo en unos minutos, puedes:
                  </p>
                  <div className="mt-2">
                    <button
                      onClick={handleResendEmail}
                      className="text-sm font-medium text-yellow-700 hover:text-yellow-600 underline"
                    >
                      Reenviar el correo
                    </button>
                  </div>
                </div>
              </div>
            </div>

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
                    <a
                      href="https://mail.google.com/mail/u/0/#advanced-search/from=noreply%40email.pildorasnocode.com&subject=Tu+acceso+a+Muegano&subset=all&within=1d&sizeoperator=s_sl&sizeunit=s_smb&query=muegano"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                      </svg>
                      Buscar en Gmail
                    </a>
                  </li>
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
