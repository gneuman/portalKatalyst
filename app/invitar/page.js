"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

function InvitarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Si no está logueado, redirigir a login y luego volver aquí
    if (sessionStatus === "unauthenticated") {
      const params = new URLSearchParams(window.location.search).toString();
      router.replace(`/api/auth/signin?callbackUrl=/invitar?${params}`);
      return;
    }
    if (sessionStatus !== "authenticated") return;

    const processInvite = async () => {
      try {
        const token = searchParams.get("token");
        const empresaId = searchParams.get("empresaId");
        const invitadorMondayId = searchParams.get("invitadorMondayId");
        if (!token || !empresaId || !invitadorMondayId) {
          setStatus("error");
          setMessage("Faltan parámetros en el enlace de invitación");
          return;
        }
        setStatus("loading");
        setMessage("Procesando invitación...");
        // Validar invitación y obtener el email de la invitación
        const res = await fetch(`/api/invite/validate?token=${token}`);
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "Invitación no válida");
          return;
        }
        // Validar que el usuario logueado sea el invitado
        if (
          session?.user?.email &&
          data?.debug?.email &&
          session.user.email !== data.debug.email
        ) {
          toast.error(
            "Este enlace es para otro usuario. Por favor, inicia sesión con el email correcto."
          );
          setTimeout(() => {
            router.replace("/invitar");
          }, 2000);
          return;
        }
        // Aceptar invitación automáticamente
        const acceptRes = await fetch("/api/invite/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, empresaId, invitadorMondayId }),
        });
        if (!acceptRes.ok) {
          const data = await acceptRes.json();
          setStatus("error");
          setMessage(data.error || "Error al aceptar la invitación");
          return;
        }
        setStatus("success");
        setMessage(
          "¡Invitación aceptada correctamente! Redirigiendo al dashboard..."
        );
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch (error) {
        setStatus("error");
        setMessage("Error al procesar la invitación");
      }
    };
    processInvite();
  }, [searchParams, router, session, sessionStatus]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          {(status === "loading" || status === "processing") && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          )}
          <h2 className="text-2xl font-bold mb-4">
            {status === "loading" && "Procesando invitación..."}
            {status === "processing" && "Procesando..."}
            {status === "success" && "¡Éxito!"}
            {status === "error" && "Error"}
          </h2>
          <p className="text-gray-600 mb-2">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default function InvitarPage() {
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
      <InvitarContent />
    </Suspense>
  );
}
