"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("validando");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setError("Token de verificación no proporcionado.");
      return;
    }

    // Llama al endpoint API para verificar el token
    fetch(`/api/auth/verify?token=${token}`, {
      headers: {
        Accept: "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("ok");
          setMessage(data.message || "¡Correo verificado!");
          setTimeout(
            () => router.push(data.redirect || "/dashboard?verified=1"),
            1500
          );
        } else {
          setStatus("error");
          setError(data.error || "Token inválido o expirado.");
        }
      })
      .catch((err) => {
        console.error("Error en verificación:", err);
        setStatus("error");
        setError("Error de red o del servidor.");
      });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb]">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full flex flex-col items-center">
        {status === "validando" && (
          <>
            <svg
              className="animate-spin h-10 w-10 text-blue-600 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              ></path>
            </svg>
            <h2 className="text-xl font-bold mb-2 text-center">
              Validando tu correo...
            </h2>
            <p className="text-gray-600 text-center">
              Por favor espera un momento.
            </p>
          </>
        )}
        {status === "ok" && (
          <>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-center text-green-700">
              {message}
            </h2>
            <p className="text-gray-600 text-center">
              Redirigiendo a tu dashboard...
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-4h2v2h-2v-2zm0-8h2v6h-2V6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-center text-red-700">
              Error al verificar
            </h2>
            <p className="text-gray-600 text-center">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}
