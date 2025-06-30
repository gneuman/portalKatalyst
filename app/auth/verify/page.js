"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifyPage() {
  const params = useSearchParams();
  const email = params.get("email");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">
          Verifica tu correo
        </h1>
        <p className="text-gray-700 mb-2">
          Te hemos enviado un enlace de acceso a{" "}
          <span className="font-semibold">{email}</span>.
        </p>
        <p className="text-gray-500">
          Revisa tu bandeja de entrada y sigue el enlace para continuar.
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-600">Cargando...</div>
        </div>
      }
    >
      <VerifyPage />
    </Suspense>
  );
}
