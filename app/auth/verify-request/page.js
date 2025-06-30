"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const sendVerificationEmail = async () => {
    if (!email) return;

    setSendingEmail(true);
    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setEmailSent(true);
        console.log("Correo de verificación enviado exitosamente");
      } else {
        console.error(
          "Error al enviar correo de verificación:",
          response.status
        );
      }
    } catch (error) {
      console.error("Error al enviar correo de verificación:", error);
    } finally {
      setSendingEmail(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!email) {
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching user data for email:", email);
        const response = await fetch(
          `/api/user/profile?email=${encodeURIComponent(email)}`
        );
        console.log("Response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("Datos del usuario recibidos:", data);
          setUserData(data);

          // El correo ya fue enviado desde el registro, no enviar automáticamente
          setEmailSent(true);
        } else {
          const errorText = await response.text();
          console.error(
            "Error al obtener datos del usuario:",
            response.status,
            errorText
          );
          setError(
            `Error ${response.status}: No se pudieron obtener los datos del usuario`
          );
        }
      } catch (err) {
        console.error("Error al obtener datos del usuario:", err);
        setError(`Error de conexión: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          {/* Icono y título */}
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Verifica tu correo
            </h2>
            <p className="text-gray-600">
              Se ha enviado un enlace de verificación a{" "}
              <span className="font-semibold text-blue-600">
                {email || "tu correo"}
              </span>
            </p>
          </div>

          {/* Estado del correo */}
          {emailSent ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-3 h-3 text-white"
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
                <p className="text-green-700 font-medium">
                  Correo enviado exitosamente
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-yellow-700 font-medium">
                  Reenviando correo...
                </p>
              </div>
            </div>
          )}

          {/* Botón de reenvío */}
          <button
            onClick={sendVerificationEmail}
            disabled={sendingEmail}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6 font-medium transition-all duration-200 transform hover:scale-105"
          >
            {sendingEmail ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Enviando...
              </div>
            ) : (
              "Reenviar correo de verificación"
            )}
          </button>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-8">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-gray-600 font-medium">
                Revisando tu correo...
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Verificando información de tu cuenta
              </p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          ) : userData ? (
            <div className="text-center py-4">
              <p className="text-gray-600 text-sm">
                Tu cuenta está lista para ser verificada
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-gray-600 font-medium">
                Revisando tu correo...
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Verificando información de tu cuenta
              </p>
            </div>
          )}

          {/* Katalyst ID específico - Removido para simplificar la interfaz */}
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
