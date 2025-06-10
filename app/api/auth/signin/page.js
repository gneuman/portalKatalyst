"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { FaUsers, FaComments, FaCalendarAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("=== INICIO DEL PROCESO DE AUTENTICACIÓN ===");
      console.log("Email ingresado:", email);

      // Verificar si el usuario existe
      console.log("Verificando existencia del usuario en la base de datos...");
      const userResponse = await fetch(`/api/user/profile?email=${email}`);
      console.log("Respuesta del servidor:", userResponse.status);

      const userData = await userResponse.json();
      console.log("Datos del usuario:", userData);

      if (userResponse.status === 404) {
        console.log("Usuario no encontrado, redirigiendo al registro...");
        const registerUrl = `/register?email=${encodeURIComponent(email)}`;
        console.log("URL de redirección:", registerUrl);
        router.push(registerUrl);
        return;
      }

      console.log("Usuario encontrado, procediendo con el inicio de sesión...");
      const result = await signIn("email", {
        email,
        callbackUrl: "/dashboard",
        redirect: false,
      });

      console.log("Resultado de signIn:", result);

      if (result?.error) {
        console.error("Error en signIn:", result.error);
        setError(
          "Hubo un error al enviar el correo. Por favor, intenta de nuevo."
        );
      } else {
        console.log("Redirigiendo a la página de verificación...");
        router.push(
          `/api/auth/verify-request?email=${encodeURIComponent(email)}`
        );
      }
    } catch (error) {
      console.error("=== ERROR EN EL PROCESO DE AUTENTICACIÓN ===");
      console.error("Tipo de error:", error.name);
      console.error("Mensaje de error:", error.message);
      console.error("Stack trace:", error.stack);
      setError("Ocurrió un error inesperado. Por favor, intenta de nuevo.");
    } finally {
      console.log("=== FIN DEL PROCESO DE AUTENTICACIÓN ===");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black">
      {/* Columna izquierda - Formulario */}
      <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24 bg-gray-800">
        <div className="mx-auto w-full max-w-sm lg:w-96 flex flex-col items-center justify-center h-full">
          {/* Logo */}
          <div className="flex justify-center mb-8 w-full">
            <Image
              src="/images/Katalyst.png"
              alt="Katalyst Logo"
              width={180}
              height={60}
            />
          </div>
          <div className="w-full">
            <h2 className="mt-6 text-3xl font-extrabold text-white text-center">
              Bienvenido a Katalyst
            </h2>
            <p className="mt-2 text-sm text-white text-center">
              Innova, emprende e impulsa tu futuro.
            </p>
          </div>

          <div className="mt-8 w-full">
            <div className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-white"
                  >
                    Correo electrónico
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-400 focus:border-orange-400 sm:text-sm bg-white text-black"
                      placeholder="tu@correo.com"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-orange-400 text-sm">{error}</div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-400 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 disabled:opacity-50"
                  >
                    {loading ? "Enviando..." : "Enviar enlace mágico"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Columna derecha - Imagen y características */}
      <div className="hidden lg:block relative w-0 flex-1 bg-black flex items-center justify-center min-h-screen">
        <div className="text-center flex flex-col items-center justify-center h-full w-full">
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-widest">
            KATALYST
          </h1>
          <p className="text-lg text-orange-400 font-semibold mb-2">
            INNOVA · EMPRENDE · IMPULSA
          </p>
          <p className="text-white text-base opacity-70">
            Bienvenido a la comunidad Katalyst
          </p>
        </div>
      </div>
    </div>
  );
}
