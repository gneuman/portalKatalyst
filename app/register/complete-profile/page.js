"use client";
import { useSearchParams } from "next/navigation";
import UserProfileForm from "@/components/UserProfileForm";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";

export default function CompleteProfilePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);

  // Función para asegurar que existe el contacto en Monday.com
  const ensureMondayContact = async () => {
    if (!email) return;

    try {
      console.log(
        "[CompleteProfilePage] Verificando contacto en Monday.com para:",
        email
      );

      // Primero verificar si el usuario tiene personalMondayId
      const userResponse = await fetch(
        `/api/user/profile?email=${encodeURIComponent(email)}`
      );
      const userData = await userResponse.json();

      if (userResponse.ok && userData.personalMondayId) {
        console.log(
          "[CompleteProfilePage] Usuario ya tiene personalMondayId:",
          userData.personalMondayId
        );
        setIsInitializing(false);
        return;
      }

      // Si no tiene personalMondayId, crear el contacto en Monday.com solo con el email
      console.log(
        "[CompleteProfilePage] Creando contacto en Monday.com solo con email..."
      );
      const createResponse = await fetch("/api/auth/create-monday-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const createData = await createResponse.json();

      if (createResponse.ok && createData.mondayId) {
        console.log(
          "[CompleteProfilePage] Contacto creado en Monday.com con ID:",
          createData.mondayId
        );
        toast.success("Contacto sincronizado con Monday.com");
      } else {
        console.error(
          "[CompleteProfilePage] Error al crear contacto:",
          createData
        );
        toast.error("Error al sincronizar con Monday.com");
      }
    } catch (error) {
      console.error(
        "[CompleteProfilePage] Error en ensureMondayContact:",
        error
      );
      toast.error("Error al verificar contacto en Monday.com");
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    ensureMondayContact();
  }, [email]);

  // Estado para controlar si mostrar el formulario o ir directamente a verificación
  const [showForm, setShowForm] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Función que se ejecuta después de guardar exitosamente
  const handleFormSuccess = async () => {
    setIsProcessing(true);
    setShowForm(false);

    try {
      // Usar el mismo método que el signin normal para enviar el correo
      const { signIn } = await import("next-auth/react");

      console.log("Enviando correo de verificación usando NextAuth...");
      const result = await signIn("email", {
        email,
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (result?.error) {
        console.error("Error en signIn:", result.error);
        toast.error(
          "Hubo un error al enviar el correo. Por favor, intenta de nuevo."
        );
        setShowForm(true); // Volver a mostrar el formulario si hay error
      } else {
        console.log(
          "Correo enviado exitosamente, redirigiendo a verificación..."
        );
        toast.success(
          "Perfil completado. Revisa tu correo para verificar tu cuenta."
        );
        router.push(`/auth/verify-request?email=${encodeURIComponent(email)}`);
      }
    } catch (error) {
      console.error("Error al enviar correo:", error);
      toast.error("Error al enviar el correo de verificación");
      setShowForm(true); // Volver a mostrar el formulario si hay error
    } finally {
      setIsProcessing(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Error</h2>
            <p className="mt-2 text-sm text-gray-600">
              No se proporcionó un email válido
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <h2 className="text-2xl font-bold text-gray-900 mt-4">
              Sincronizando...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Verificando contacto en Monday.com
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <h2 className="text-2xl font-bold text-gray-900 mt-4">
              Enviando correo...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Preparando tu verificación de cuenta
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <h2 className="text-2xl font-bold text-gray-900 mt-4">
              Redirigiendo...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Te estamos llevando a la página de verificación
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Completa tu perfil
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Por favor, completa tu información personal antes de verificar tu
            cuenta
          </p>
        </div>

        <UserProfileForm
          email={email}
          mode="registration"
          onSuccess={handleFormSuccess}
        />
      </div>
    </div>
  );
}
