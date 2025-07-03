"use client";
import { useState } from "react";

export default function TestResendPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/test-resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data);
      }
    } catch (err) {
      setError({ error: "Error de red", details: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Prueba de Resend
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Verifica si el sistema de correos está funcionando
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleTest}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email de prueba
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar correo de prueba"}
            </button>
          </div>
        </form>

        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-sm font-medium text-green-800">Éxito</h3>
            <p className="mt-1 text-sm text-green-700">{result.message}</p>
            <pre className="mt-2 text-xs text-green-600 overflow-auto">
              {JSON.stringify(result.result, null, 2)}
            </pre>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error.error}</p>
            {error.details && (
              <p className="mt-1 text-sm text-red-600">{error.details}</p>
            )}
            {error.code && (
              <p className="mt-1 text-sm text-red-600">Código: {error.code}</p>
            )}
            {error.statusCode && (
              <p className="mt-1 text-sm text-red-600">
                Status: {error.statusCode}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
