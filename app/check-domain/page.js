"use client";
import { useState, useEffect } from "react";

function DomainToggleButton({ isVerified }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleToggle = async (useTestDomain) => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/toggle-resend-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useTestDomain }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message });
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error de red" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {!isVerified ? (
        <button
          onClick={() => handleToggle(true)}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
        >
          {loading ? "Configurando..." : "Usar Dominio de Prueba"}
        </button>
      ) : (
        <button
          onClick={() => handleToggle(false)}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Configurando..." : "Usar Dominio Verificado"}
        </button>
      )}

      {message && (
        <div
          className={`p-2 rounded text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

export default function CheckDomainPage() {
  const [domainInfo, setDomainInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkDomain = async () => {
      try {
        const response = await fetch("/api/check-resend-domain");
        const data = await response.json();

        if (response.ok) {
          setDomainInfo(data);
        } else {
          setError(data);
        }
      } catch (err) {
        setError({ error: "Error de red", details: err.message });
      } finally {
        setLoading(false);
      }
    };

    checkDomain();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Verificando dominio...</div>
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
            Estado del Dominio en Resend
          </h1>

          <div className="space-y-6">
            {/* Estado del dominio objetivo */}
            <div
              className={`p-4 rounded-lg ${
                domainInfo.isVerified
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <h2 className="text-lg font-semibold mb-3">
                Dominio: {domainInfo.targetDomain}
              </h2>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    domainInfo.isVerified
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {domainInfo.isVerified ? "Verificado" : "No verificado"}
                </span>
              </div>
            </div>

            {/* Lista de dominios */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">
                Dominios en tu cuenta ({domainInfo.totalDomains})
              </h2>
              {domainInfo.domains && domainInfo.domains.length > 0 ? (
                <div className="space-y-2">
                  {domainInfo.domains.map((domain, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <span className="font-medium">{domain.name}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          domain.status === "valid"
                            ? "bg-green-100 text-green-800"
                            : domain.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {domain.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No hay dominios configurados</p>
              )}
            </div>

            {/* Recomendaciones */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-900 mb-3">
                Recomendaciones
              </h2>
              <ul className="space-y-2 text-sm text-yellow-800">
                {!domainInfo.isVerified ? (
                  <>
                    <li>
                      • El dominio {domainInfo.targetDomain} no está verificado
                    </li>
                    <li>
                      • Ve a tu dashboard de Resend y verifica este dominio
                    </li>
                    <li>
                      • O usa temporalmente onboarding@resend.dev para pruebas
                    </li>
                  </>
                ) : (
                  <li>• El dominio está verificado correctamente</li>
                )}
                <li>
                  • Los correos solo aparecerán en el dashboard si usas un
                  dominio verificado
                </li>
                <li>
                  • onboarding@resend.dev es solo para pruebas y no aparece en
                  el dashboard
                </li>
              </ul>
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
              href="/debug-config"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Ver Configuración
            </a>
            <DomainToggleButton isVerified={domainInfo.isVerified} />
          </div>
        </div>
      </div>
    </div>
  );
}
