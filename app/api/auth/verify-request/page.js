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
        const response = await fetch(
          `/api/user/profile?email=${encodeURIComponent(email)}`
        );
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          console.log("Datos del usuario:", data);

          // Enviar correo de verificación automáticamente
          try {
            const verificationResponse = await fetch(
              "/api/auth/send-verification",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
              }
            );

            if (verificationResponse.ok) {
              console.log("Correo de verificación enviado exitosamente");
              setEmailSent(true);
            } else {
              console.error(
                "Error al enviar correo de verificación:",
                verificationResponse.status
              );
            }
          } catch (verificationError) {
            console.error(
              "Error al enviar correo de verificación:",
              verificationError
            );
          }
        } else {
          console.error("Error al obtener datos del usuario:", response.status);
          setError("No se pudieron obtener los datos del usuario");
        }
      } catch (err) {
        console.error("Error al obtener datos del usuario:", err);
        setError("Error al obtener datos del usuario");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Verifica tu correo</h2>
          <p className="text-gray-600 mb-2">
            Se ha enviado un enlace de verificación a {email || "tu correo"}.
          </p>
          <p className="text-gray-500 text-sm mb-4">
            Por favor, revisa tu bandeja de entrada y sigue el enlace para
            completar el proceso.
          </p>

          {/* Estado del correo */}
          {emailSent ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
              <p className="text-green-700 text-sm">
                ✓ Correo de verificación enviado exitosamente
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-yellow-700 text-sm">
                ⚠ No se pudo enviar el correo automáticamente
              </p>
            </div>
          )}

          {/* Botón de reenvío */}
          <button
            onClick={sendVerificationEmail}
            disabled={sendingEmail}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {sendingEmail ? "Enviando..." : "Reenviar correo de verificación"}
          </button>

          {/* Debug Info */}
          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">Cargando datos...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : userData ? (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4 text-left">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Debug Info:
              </h3>
              <div className="space-y-1 text-xs text-gray-600">
                <p>
                  <strong>Email:</strong> {userData.email}
                </p>
                <p>
                  <strong>Monday ID:</strong>{" "}
                  {userData.personalMondayId || "No asignado"}
                </p>
                <p>
                  <strong>Nombre:</strong> {userData.name || "No definido"}
                </p>
                <p>
                  <strong>Nombre Completo:</strong>{" "}
                  {userData.nombreCompleto || "No definido"}
                </p>
                <p>
                  <strong>Comunidad:</strong>{" "}
                  {userData.comunidad || "No definida"}
                </p>
                <p>
                  <strong>Foto:</strong> {userData.fotoPerfil ? "Sí" : "No"}
                </p>
                <p>
                  <strong>Verificado:</strong>{" "}
                  {userData.emailVerified ? "Sí" : "No"}
                </p>
                <p>
                  <strong>Válido:</strong> {userData.validado ? "Sí" : "No"}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-yellow-700 text-sm">
                Usuario no encontrado en la base de datos
              </p>
            </div>
          )}

          {/* Monday ID específico */}
          {userData?.personalMondayId && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-center">
              <p className="text-xs text-gray-500">Monday ID:</p>
              <p className="text-sm font-mono text-gray-700">
                {userData.personalMondayId}
              </p>
            </div>
          )}
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
