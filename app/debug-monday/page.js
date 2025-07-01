"use client";

import { useState } from "react";

export default function DebugMondayPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState(null);
  const [error, setError] = useState("");
  const [signinResult, setSigninResult] = useState(null);

  const handleDebug = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDebugData(null);
    setSigninResult(null);

    try {
      console.log("=== INICIO DEBUG MONDAY ===");
      console.log("Email a debuggear:", email);

      // PASO 1: Buscar en Monday.com
      console.log("PASO 1: Buscando en Monday.com...");
      const mondayResponse = await fetch("/api/monday/contact/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const mondayData = await mondayResponse.json();
      console.log("Respuesta de Monday.com:", mondayData);

      // PASO 2: Buscar en MongoDB
      console.log("PASO 2: Buscando en MongoDB...");
      const userResponse = await fetch(
        `/api/user/profile?email=${encodeURIComponent(email)}`
      );
      console.log("Respuesta de MongoDB:", userResponse.status);

      let userData = null;
      if (userResponse.ok) {
        userData = await userResponse.json();
        console.log("Datos del usuario en MongoDB:", userData);
      } else {
        console.log("Usuario NO encontrado en MongoDB");
      }

      // Compilar datos de debug
      const debugInfo = {
        email,
        timestamp: new Date().toISOString(),
        monday: {
          found: mondayResponse.ok && mondayData.found,
          mondayId: mondayData.mondayId,
          name: mondayData.name,
          response: mondayData,
          status: mondayResponse.status,
        },
        mongodb: {
          found: userResponse.ok,
          userData: userData,
          status: userResponse.status,
        },
        analysis: {
          existsInMonday: mondayResponse.ok && mondayData.found,
          existsInMongo: userResponse.ok,
          mondayIdMatch: userData?.personalMondayId === mondayData.mondayId,
          needsSync:
            (mondayResponse.ok && mondayData.found) !== userResponse.ok,
        },
      };

      setDebugData(debugInfo);
      console.log("=== FIN DEBUG MONDAY ===");
      console.log("Datos de debug:", debugInfo);
    } catch (error) {
      console.error("Error en debug:", error);
      setError("Error al realizar el debug: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSignin = async () => {
    if (!email) {
      setError("Ingresa un email primero");
      return;
    }

    setLoading(true);
    setError("");
    setSigninResult(null);

    try {
      console.log("=== INICIO TEST SIGNIN ===");
      console.log("Email a probar:", email);

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

      let result = {
        email,
        mondayExists,
        mongoExists,
        mondayId,
        action: "",
        success: false,
        error: null,
      };

      if (mondayExists && mongoExists) {
        // CASO 1: Existe en ambos - Verificar perfil y enviar correo
        console.log("CASO 1: Existe en Monday y MongoDB");
        result.action = "Verificar perfil y enviar correo";
        result.success = true;

        // Verificar si el usuario necesita completar su perfil
        if (
          userData.name === userData.email ||
          !userData.name ||
          userData.name === "Usuario NoCode" ||
          !userData.firstName ||
          !userData.lastName
        ) {
          result.action = "Redirigir a completar perfil";
        } else {
          result.action = "Enviar correo de verificación";
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
          result.action = "Usuario creado en MongoDB con Monday ID existente";
          result.success = true;
        } else {
          const errorText = await createResponse.text();
          console.error("Error al crear usuario en MongoDB:", errorText);
          result.action = "Error al crear usuario en MongoDB";
          result.error = errorText;
          result.success = false;
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
          result.action = "Usuario creado exitosamente en ambos sistemas";
          result.success = true;
        } else {
          const errorText = await createResponse.text();
          console.error("Error al crear usuario:", errorText);
          result.action = "Error al crear usuario";
          result.error = errorText;
          result.success = false;
        }
      } else {
        // CASO IMPOSIBLE: Existe en MongoDB pero NO en Monday (no debería pasar)
        console.error("CASO IMPOSIBLE: Existe en MongoDB pero NO en Monday");
        result.action = "Error en la sincronización de datos";
        result.error = "Existe en MongoDB pero NO en Monday";
        result.success = false;
      }

      setSigninResult(result);
      console.log("=== FIN TEST SIGNIN ===");
      console.log("Resultado:", result);
    } catch (error) {
      console.error("=== ERROR EN TEST SIGNIN ===");
      console.error("Error:", error);
      setError("Error al probar signin: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Debug Monday.com & MongoDB
            </h1>
            <p className="text-gray-600">
              Ingresa un email para verificar su estado en ambos sistemas
            </p>
          </div>

          <form onSubmit={handleDebug} className="mb-8">
            <div className="flex gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                required
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Buscando..." : "Debug"}
              </button>
              <button
                type="button"
                onClick={handleTestSignin}
                disabled={loading || !email}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Probando..." : "Test Signin"}
              </button>
            </div>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {signinResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                Resultado del Test Signin
              </h2>
              <div className="space-y-2">
                <div>
                  <strong>Email:</strong> {signinResult.email}
                </div>
                <div>
                  <strong>Existe en Monday:</strong>{" "}
                  {signinResult.mondayExists ? "Sí" : "No"}
                </div>
                <div>
                  <strong>Existe en MongoDB:</strong>{" "}
                  {signinResult.mongoExists ? "Sí" : "No"}
                </div>
                {signinResult.mondayId && (
                  <div>
                    <strong>Monday ID:</strong> {signinResult.mondayId}
                  </div>
                )}
                <div>
                  <strong>Acción:</strong> {signinResult.action}
                </div>
                <div>
                  <strong>Éxito:</strong> {signinResult.success ? "✅" : "❌"}
                </div>
                {signinResult.error && (
                  <div>
                    <strong>Error:</strong>{" "}
                    <span className="text-red-600">{signinResult.error}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {debugData && (
            <div className="space-y-6">
              {/* Resumen */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Resumen</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${
                        debugData.analysis.existsInMonday
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {debugData.analysis.existsInMonday ? "✅" : "❌"}
                    </div>
                    <div className="text-sm text-gray-600">Monday.com</div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${
                        debugData.analysis.existsInMongo
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {debugData.analysis.existsInMongo ? "✅" : "❌"}
                    </div>
                    <div className="text-sm text-gray-600">MongoDB</div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${
                        debugData.analysis.mondayIdMatch
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {debugData.analysis.mondayIdMatch ? "✅" : "⚠️"}
                    </div>
                    <div className="text-sm text-gray-600">IDs Coinciden</div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${
                        debugData.analysis.needsSync
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {debugData.analysis.needsSync ? "⚠️" : "✅"}
                    </div>
                    <div className="text-sm text-gray-600">Necesita Sync</div>
                  </div>
                </div>
              </div>

              {/* Monday.com Details */}
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Monday.com</h2>
                <div className="space-y-2">
                  <div>
                    <strong>Encontrado:</strong>{" "}
                    {debugData.monday.found ? "Sí" : "No"}
                  </div>
                  {debugData.monday.mondayId && (
                    <div>
                      <strong>Monday ID:</strong> {debugData.monday.mondayId}
                    </div>
                  )}
                  {debugData.monday.name && (
                    <div>
                      <strong>Nombre:</strong> {debugData.monday.name}
                    </div>
                  )}
                  <div>
                    <strong>Status:</strong> {debugData.monday.status}
                  </div>
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-600">
                    Ver respuesta completa
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(debugData.monday.response, null, 2)}
                  </pre>
                </details>
              </div>

              {/* MongoDB Details */}
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">MongoDB</h2>
                <div className="space-y-2">
                  <div>
                    <strong>Encontrado:</strong>{" "}
                    {debugData.mongodb.found ? "Sí" : "No"}
                  </div>
                  <div>
                    <strong>Status:</strong> {debugData.mongodb.status}
                  </div>
                  {debugData.mongodb.userData && (
                    <>
                      <div>
                        <strong>Monday ID:</strong>{" "}
                        {debugData.mongodb.userData.personalMondayId ||
                          "No asignado"}
                      </div>
                      <div>
                        <strong>Nombre:</strong>{" "}
                        {debugData.mongodb.userData.name || "No asignado"}
                      </div>
                      <div>
                        <strong>Verificado:</strong>{" "}
                        {debugData.mongodb.userData.emailVerified ? "Sí" : "No"}
                      </div>
                    </>
                  )}
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-600">
                    Ver datos completos
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(debugData.mongodb.userData, null, 2)}
                  </pre>
                </details>
              </div>

              {/* Análisis */}
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Análisis</h2>
                <div className="space-y-2">
                  <div>
                    <strong>Existe en Monday:</strong>{" "}
                    {debugData.analysis.existsInMonday ? "Sí" : "No"}
                  </div>
                  <div>
                    <strong>Existe en MongoDB:</strong>{" "}
                    {debugData.analysis.existsInMongo ? "Sí" : "No"}
                  </div>
                  <div>
                    <strong>IDs coinciden:</strong>{" "}
                    {debugData.analysis.mondayIdMatch ? "Sí" : "No"}
                  </div>
                  <div>
                    <strong>Necesita sincronización:</strong>{" "}
                    {debugData.analysis.needsSync ? "Sí" : "No"}
                  </div>
                </div>
              </div>

              {/* Raw Data */}
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Datos Completos</h2>
                <details>
                  <summary className="cursor-pointer text-blue-600">
                    Ver datos raw
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(debugData, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
