"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { FaUsers, FaComments, FaCalendarAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";

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
        const registerUrl = `/api/auth/register?email=${encodeURIComponent(
          email
        )}`;
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
        router.push("/api/auth/verify-request");
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
    <div className="min-h-screen flex">
      {/* Columna izquierda - Formulario */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Inicia sesión en tu cuenta
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Ingresa tu correo electrónico para recibir un enlace mágico
            </p>
          </div>

          <div className="mt-8">
            <div className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
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
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="tu@correo.com"
                    />
                  </div>
                </div>

                {error && <div className="text-red-600 text-sm">{error}</div>}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="absolute inset-0 bg-black opacity-20" />
          <div className="relative h-full flex flex-col justify-center px-12">
            <div className="space-y-8">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <FaUsers className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Comunidad Activa
                  </h3>
                  <p className="mt-1 text-blue-100">
                    Únete a nuestra comunidad de usuarios
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <FaComments className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Soporte 24/7</h3>
                  <p className="mt-1 text-blue-100">
                    Estamos aquí para ayudarte
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <FaCalendarAlt className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Actualizaciones Regulares
                  </h3>
                  <p className="mt-1 text-blue-100">
                    Nuevas características cada semana
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
