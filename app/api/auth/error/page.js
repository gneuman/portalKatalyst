"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error) => {
    switch (error) {
      case "Configuration":
        return "Hay un problema con la configuración del servidor.";
      case "AccessDenied":
        return "No tienes permiso para acceder a esta página.";
      case "Verification":
        return "El enlace de verificación ha expirado o ya ha sido utilizado.";
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
      case "EmailCreateAccount":
      case "Callback":
        return "Hubo un error al intentar iniciar sesión. Por favor, intenta de nuevo.";
      case "OAuthAccountNotLinked":
        return "Esta cuenta de correo ya está registrada con otro método de inicio de sesión.";
      case "EmailSignin":
        return "No se pudo enviar el correo de verificación.";
      case "CredentialsSignin":
        return "Las credenciales proporcionadas no son válidas.";
      case "SessionRequired":
        return "Por favor, inicia sesión para acceder a esta página.";
      default:
        return "Ha ocurrido un error inesperado. Por favor, intenta de nuevo.";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Error de autenticación
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {getErrorMessage(error)}
            </p>
          </div>

          <div className="mt-6">
            <Link
              href="/api/auth/signin"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Volver a intentar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
