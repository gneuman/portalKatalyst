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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Verifica tu correo</h2>
          <p className="text-gray-600 mb-2">
            Se ha enviado un enlace de verificación a {email || "tu correo"}.
          </p>
          <p className="text-gray-500 text-sm">
            Por favor, revisa tu bandeja de entrada y sigue el enlace para
            completar el proceso.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold mb-4">Cargando...</h2>
            </div>
          </div>
        </div>
      }
    >
      <VerifyRequestContent />
    </Suspense>
  );
}
