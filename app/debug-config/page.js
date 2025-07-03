"use client";
import { useState, useEffect } from "react";

export default function DebugConfigPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/debug-config");
        const data = await response.json();

        if (response.ok) {
          setConfig(data);
        } else {
          setError(data);
        }
      } catch (err) {
        setError({ error: "Error de red", details: err.message });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando configuración...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">
          <h2 className="text-xl font-bold">Error</h2>
          <p>{error.error}</p>
          {error.details && <p className="text-sm">{error.details}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Configuración del Sistema
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resend Configuration */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">
                Resend
              </h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">API Key presente:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs ${
                      config.resend.apiKeyPresent
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {config.resend.apiKeyPresent ? "Sí" : "No"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Longitud API Key:</span>
                  <span className="ml-2">{config.resend.apiKeyLength}</span>
                </div>
                <div>
                  <span className="font-medium">From NoReply:</span>
                  <span className="ml-2 text-gray-600">
                    {config.resend.fromNoReply}
                  </span>
                </div>
                <div>
                  <span className="font-medium">From Admin:</span>
                  <span className="ml-2 text-gray-600">
                    {config.resend.fromAdmin}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Support Email:</span>
                  <span className="ml-2 text-gray-600">
                    {config.resend.supportEmail}
                  </span>
                </div>
              </div>
            </div>

            {/* NextAuth Configuration */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-green-900 mb-3">
                NextAuth
              </h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">URL:</span>
                  <span className="ml-2 text-gray-600">
                    {config.nextauth.url || "No configurado"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Secret presente:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs ${
                      config.nextauth.secret
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {config.nextauth.secret ? "Sí" : "No"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Longitud Secret:</span>
                  <span className="ml-2">{config.nextauth.secretLength}</span>
                </div>
              </div>
            </div>

            {/* MongoDB Configuration */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-purple-900 mb-3">
                MongoDB
              </h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">URI presente:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs ${
                      config.mongodb.uri
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {config.mongodb.uri ? "Sí" : "No"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Longitud URI:</span>
                  <span className="ml-2">{config.mongodb.uriLength}</span>
                </div>
              </div>
            </div>

            {/* Domain Configuration */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-900 mb-3">
                Dominio
              </h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Nombre:</span>
                  <span className="ml-2 text-gray-600">
                    {config.domain.name}
                  </span>
                </div>
                <div>
                  <span className="font-medium">URL completa:</span>
                  <span className="ml-2 text-gray-600">
                    {config.domain.fullUrl || "No configurado"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Entorno:</span>
                  <span className="ml-2 text-gray-600">
                    {config.environment}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Timestamp:</span>
                  <span className="ml-2 text-gray-600">{config.timestamp}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <a
              href="/test-resend"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Probar Resend
            </a>
            <a
              href="/api/auth/signin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Ir a Signin
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
