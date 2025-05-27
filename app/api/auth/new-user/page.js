"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function NewUser() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      // Redirigir al dashboard después de 3 segundos
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              ¡Bienvenido a Muegano!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Tu cuenta ha sido creada exitosamente.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Serás redirigido al dashboard en unos segundos...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
