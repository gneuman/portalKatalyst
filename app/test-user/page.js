"use client";
import { useState, useEffect } from "react";

export default function TestUserPage() {
  const [email, setEmail] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [boardId, setBoardId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewCurl, setPreviewCurl] = useState("");

  // Generar preview del curl cuando cambie el email
  useEffect(() => {
    if (email) {
      const usedBoardId = boardId || "9010881028";
      const usedApiKey = apiKey || "***";
      const columnValues = "{}";
      const mutationQuery = `mutation { create_item (board_id: ${usedBoardId}, item_name: "${email}", column_values: "${columnValues}", create_labels_if_missing: false) { id } }`;

      const curlPreview = `curl -X POST 'https://api.monday.com/v2' \\
  -H 'user-agent: Make/production' \\
  -H 'api-version: 2024-10' \\
  -H 'content-type: application/json' \\
  -H 'authorization: ${usedApiKey}' \\
  -d '{"query":"${mutationQuery}"}'`;

      setPreviewCurl(curlPreview);
    } else {
      setPreviewCurl("");
    }
  }, [email, apiKey, boardId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/test-create-monday-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, apiKey, boardId }),
      });
      const data = await res.json();
      setResult({ status: res.status, data });
    } catch (err) {
      setResult({ status: "error", data: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-4xl w-full">
        <h1 className="text-2xl font-bold mb-4">
          Test Crear Usuario en Monday.com
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              className="w-full border px-3 py-2 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MONDAY_API_KEY (opcional)
            </label>
            <input
              type="text"
              className="w-full border px-3 py-2 rounded"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Deja vacío para usar el del backend"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MONDAY_BOARD_ID (opcional)
            </label>
            <input
              type="text"
              className="w-full border px-3 py-2 rounded"
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              placeholder="Deja vacío para usar el del backend"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Enviando..." : "Probar creación en Monday.com"}
          </button>
        </form>

        {previewCurl && (
          <div className="mt-6">
            <h3 className="font-bold mb-2">Preview del curl que se enviará:</h3>
            <pre className="bg-gray-200 p-3 rounded text-xs overflow-x-auto">
              {previewCurl}
            </pre>
          </div>
        )}

        {result && (
          <div className="mt-6">
            <h2 className="font-bold mb-2">Respuesta:</h2>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
            {result.data && (
              <>
                {result.data.curlCommand && (
                  <div className="mt-4">
                    <h3 className="font-bold">Curl enviado:</h3>
                    <pre className="bg-gray-200 p-2 rounded text-xs overflow-x-auto">
                      {result.data.curlCommand}
                    </pre>
                  </div>
                )}
                {result.data.mutationQuery && (
                  <div className="mt-4">
                    <h3 className="font-bold">Query GraphQL:</h3>
                    <pre className="bg-gray-200 p-2 rounded text-xs overflow-x-auto">
                      {result.data.mutationQuery}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
