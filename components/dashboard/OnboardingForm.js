import { useState } from "react";

export default function OnboardingForm({
  programa,
  katalystId,
  userName,
  onClose,
  onSuccess,
}) {
  const [razon, setRazon] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!razon.trim()) {
      alert("Por favor, completa el campo de razón");
      return;
    }

    setLoading(true);
    try {
      // Obtener el boardId del programa
      const boardIdCol = programa.columns?.find(
        (c) => c.title === "Board destino"
      );
      const boardId = boardIdCol ? programa[boardIdCol.id] : null;

      if (!boardId) {
        throw new Error("No se pudo obtener el boardId del programa");
      }

      // Obtener el itemId del usuario en este board
      const statusRes = await fetch(
        `/api/registro/person-status?katalystId=${katalystId}&boardId=${boardId}`
      );
      const statusData = await statusRes.json();

      if (!statusData.success || !statusData.encontrado) {
        throw new Error("No se encontró la aplicación del usuario");
      }

      // Actualizar la razón
      const updateRes = await fetch("/api/registro/update-razon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          katalystId,
          boardId,
          itemId: statusData.itemId,
          razon: razon.trim(),
        }),
      });

      const updateData = await updateRes.json();

      if (updateData.success) {
        onSuccess();
      } else {
        throw new Error(updateData.error || "Error al actualizar la razón");
      }
    } catch (error) {
      console.error("Error al completar onboarding:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
          onClick={onClose}
        >
          ×
        </button>

        <h3 className="text-xl font-bold mb-4">Completar Onboarding</h3>
        <p className="mb-4 text-gray-700">
          Hola <b>{userName}</b>, necesitamos que completes tu onboarding para
          el programa <b>{programa?.nombre}</b>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Razón de participación *
            </label>
            <textarea
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Cuéntanos por qué quieres participar en este programa..."
              required
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !razon.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Completar Onboarding"}
            </button>
          </div>
        </form>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 text-xs text-gray-500">
            <strong>Debug:</strong> Katalyst ID: {katalystId}
          </div>
        )}
      </div>
    </div>
  );
}
