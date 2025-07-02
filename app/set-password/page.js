"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import SetPasswordForm from "@/components/SetPasswordForm";
import Image from "next/image";

function SetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener email de los parámetros de URL o de la sesión
    const emailFromParams = searchParams.get("email");
    const emailFromSession = session?.user?.email;

    if (emailFromParams) {
      setEmail(emailFromParams);
    } else if (emailFromSession) {
      setEmail(emailFromSession);
    } else {
      // Si no hay email, redirigir al signin
      router.push("/api/auth/signin");
      return;
    }

    setLoading(false);
  }, [searchParams, session, router]);

  const handleSuccess = () => {
    // Redirigir al dashboard después de establecer la contraseña
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image
            src="/images/Katalyst.png"
            alt="Katalyst Logo"
            width={180}
            height={60}
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Establecer Contraseña
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Configura una contraseña para tu cuenta de Katalyst
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <SetPasswordForm email={email} onSuccess={handleSuccess} mode="set" />
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          ¿Ya tienes una cuenta?{" "}
          <button
            onClick={() => router.push("/api/auth/signin")}
            className="font-medium text-orange-600 hover:text-orange-500"
          >
            Inicia sesión
          </button>
        </p>
        <p className="text-sm text-gray-600 mt-2">
          ¿Olvidaste tu contraseña?{" "}
          <button
            onClick={() => router.push("/reset-password")}
            className="text-orange-400 hover:text-orange-300"
          >
            Restablécela aquí
          </button>
        </p>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <SetPasswordContent />
    </Suspense>
  );
}
