"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authMode, setAuthMode] = useState("magic"); // "magic" o "password"
  const [hasPassword, setHasPassword] = useState(null);
  const router = useRouter();

  // Verificar si el usuario tiene contraseña cuando cambia el email
  useEffect(() => {
    const checkPassword = async () => {
      if (email && email.includes("@")) {
        try {
          const response = await fetch(
            `/api/auth/check-password?email=${encodeURIComponent(email)}`
          );
          if (response.ok) {
            const data = await response.json();
            setHasPassword(data.hasPassword);
          }
        } catch (error) {
          console.error("Error al verificar contraseña:", error);
        }
      }
    };

    const timeoutId = setTimeout(checkPassword, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleMagicLinkAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("=== INICIO DEL PROCESO DE AUTENTICACIÓN CON MAGIC LINK ===");
      console.log("Email ingresado:", email);

      // PASO 1: Buscar el correo en Monday.com
      console.log("PASO 1: Buscando correo en Monday.com...");
      const mondayResponse = await fetch("/api/monday/contact/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const mondayData = await mondayResponse.json();
      console.log("Respuesta de Monday.com:", mondayData);

      let mondayId = null;
      let mondayExists = false;

      if (mondayResponse.ok && mondayData.mondayId) {
        console.log(
          "✅ Correo encontrado en Monday.com con ID:",
          mondayData.mondayId
        );
        mondayId = mondayData.mondayId;
        mondayExists = true;
      } else {
        console.log("❌ Correo NO encontrado en Monday.com, se creará");
        mondayExists = false;
      }

      // PASO 2: Buscar en MongoDB
      console.log("PASO 2: Buscando en MongoDB...");
      const userResponse = await fetch(
        `/api/user/profile?email=${encodeURIComponent(email)}`
      );
      console.log("Respuesta de MongoDB:", userResponse.status);

      let userData = null;
      let mongoExists = false;

      if (userResponse.ok) {
        userData = await userResponse.json();
        console.log("✅ Usuario encontrado en MongoDB:", userData);
        mongoExists = true;
      } else {
        console.log("❌ Usuario NO encontrado en MongoDB");
        mongoExists = false;
      }

      // LÓGICA DE DECISIÓN
      console.log("=== LÓGICA DE DECISIÓN ===");
      console.log(
        "Monday existe:",
        mondayExists,
        "MongoDB existe:",
        mongoExists
      );

      if (mondayExists && mongoExists) {
        // CASO 1: Existe en ambos - Verificar perfil y enviar correo
        console.log("CASO 1: Existe en Monday y MongoDB");

        // Verificar si el usuario necesita completar su perfil
        if (
          userData.name === userData.email ||
          !userData.name ||
          userData.name === "Usuario NoCode" ||
          !userData.firstName ||
          !userData.lastName
        ) {
          console.log("Usuario necesita completar perfil, redirigiendo...");
          router.push(
            `/register/complete-profile?email=${encodeURIComponent(email)}`
          );
          return;
        }

        // Usuario completo, enviar correo de verificación
        console.log("Usuario completo, enviando correo de verificación...");
        const result = await signIn("email", {
          email,
          callbackUrl: "/dashboard",
          redirect: false,
        });

        if (result?.error) {
          console.error("Error en signIn:", result.error);
          setError(
            "Hubo un error al enviar el correo. Por favor, intenta de nuevo."
          );
        } else {
          console.log("Redirigiendo a la página de verificación...");
          router.push(
            `/auth/verify-request?email=${encodeURIComponent(email)}`
          );
        }
      } else if (mondayExists && !mongoExists) {
        // CASO 2: Existe en Monday pero NO en MongoDB - Crear MongoDB y redirigir a completar perfil
        console.log("CASO 2: Existe en Monday pero NO en MongoDB");

        // Crear usuario en MongoDB con el Monday ID existente
        const createResponse = await fetch("/api/auth/create-mongo-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            personalMondayId: mondayId,
          }),
        });

        if (createResponse.ok) {
          console.log("Usuario creado en MongoDB con Monday ID existente");
          router.push(
            `/register/complete-profile?email=${encodeURIComponent(email)}`
          );
        } else {
          console.error(
            "Error al crear usuario en MongoDB:",
            await createResponse.text()
          );
          setError("Error al crear el usuario. Por favor, intenta de nuevo.");
        }
      } else if (!mondayExists && !mongoExists) {
        // CASO 3: NO existe en ninguno - Crear ambos
        console.log("CASO 3: NO existe en Monday ni MongoDB");

        // Crear usuario completo (Monday + MongoDB)
        const createResponse = await fetch("/api/auth/register-initial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (createResponse.ok) {
          console.log("Usuario creado exitosamente en ambos sistemas");
          router.push(
            `/register/complete-profile?email=${encodeURIComponent(email)}`
          );
        } else {
          console.error("Error al crear usuario:", await createResponse.text());
          setError("Error al crear el usuario. Por favor, intenta de nuevo.");
        }
      } else {
        // CASO IMPOSIBLE: Existe en MongoDB pero NO en Monday (no debería pasar)
        console.error("CASO IMPOSIBLE: Existe en MongoDB pero NO en Monday");
        setError(
          "Error en la sincronización de datos. Por favor, contacta soporte."
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

  const handlePasswordAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("=== INICIO DEL PROCESO DE AUTENTICACIÓN CON CONTRASEÑA ===");

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        console.error("Error en autenticación:", result.error);
        setError(result.error);
      } else {
        console.log("Autenticación exitosa, redirigiendo...");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error en autenticación con contraseña:", error);
      setError("Ocurrió un error inesperado. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    if (authMode === "magic") {
      handleMagicLinkAuth(e);
    } else {
      handlePasswordAuth(e);
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

          {/* Selector de modo de autenticación */}
          <div className="mt-6 w-full">
            <div className="flex rounded-lg bg-gray-700 p-1">
              <button
                type="button"
                onClick={() => setAuthMode("magic")}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  authMode === "magic"
                    ? "bg-orange-500 text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Enlace Mágico
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("password")}
                disabled={hasPassword === false}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  authMode === "password"
                    ? "bg-orange-500 text-white"
                    : hasPassword === true
                    ? "text-gray-300 hover:text-white"
                    : hasPassword === false
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Email y Contraseña
                {hasPassword === false && email && (
                  <span className="block text-xs opacity-75">
                    No configurada
                  </span>
                )}
              </button>
            </div>
            {hasPassword === false && email && (
              <p className="mt-2 text-xs text-gray-400 text-center">
                ¿Quieres usar contraseña?{" "}
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/set-password?email=${encodeURIComponent(email)}`
                    )
                  }
                  className="text-orange-400 hover:text-orange-300"
                >
                  Configúrala aquí
                </button>
              </p>
            )}
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
                      className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-400 focus:border-orange-400 sm:text-sm bg-white text-black relative z-10"
                      placeholder="tu@correo.com"
                    />
                  </div>
                </div>

                {authMode === "password" && (
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-white"
                    >
                      Contraseña
                    </label>
                    <div className="mt-1">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-400 focus:border-orange-400 sm:text-sm bg-white text-black relative z-10"
                        placeholder="Tu contraseña"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-orange-400 text-sm">{error}</div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-400 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 disabled:opacity-50"
                  >
                    {loading
                      ? authMode === "magic"
                        ? "Enviando..."
                        : "Iniciando sesión..."
                      : authMode === "magic"
                      ? "Enviar enlace mágico"
                      : "Iniciar sesión"}
                  </button>
                </div>

                {authMode === "password" && (
                  <div className="text-center">
                    <p className="text-sm text-gray-400">
                      ¿No tienes contraseña?{" "}
                      <button
                        type="button"
                        onClick={() => setAuthMode("magic")}
                        className="text-orange-400 hover:text-orange-300"
                      >
                        Usa el enlace mágico
                      </button>
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Enlace para restablecer contraseña */}
          <div className="w-full flex flex-col items-center mt-4">
            <p className="text-sm text-gray-400">
              ¿Olvidaste tu contraseña?{" "}
              <button
                type="button"
                onClick={() => router.push("/reset-password")}
                className="text-orange-400 hover:text-orange-300"
              >
                Restablécela aquí
              </button>
            </p>
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
