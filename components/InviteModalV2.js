import React, { useState } from "react";
import { toast } from "react-hot-toast";

const InviteModalV2 = ({
  onClose,
  empresaId,
  empresaNombre,
  invitadorNombre,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [email, setEmail] = useState("");
  const [debug, setDebug] = useState(null);

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setDebug(null);
    try {
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          empresaId: empresaId,
          empresaNombre: empresaNombre,
          invitadorNombre: invitadorNombre,
        }),
      });
      const data = await response.json();
      setDebug(data);
      if (!response.ok) {
        throw new Error(data.error || "Error al enviar la invitación");
      }
      setSuccess(true);
      setInvitedEmails([...invitedEmails, email]);
      setEmail("");
      if (onSuccess) onSuccess(email);
      toast.success("¡Invitación enviada correctamente!");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Invitar Contacto{empresaNombre ? ` a ${empresaNombre}` : ""}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email del contacto
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-lg py-3 px-4"
              required
              disabled={loading}
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && (
            <div className="text-green-500 text-sm">
              ¡Invitación enviada correctamente!
            </div>
          )}
          {invitedEmails.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Emails invitados:
              </h3>
              <ul className="text-sm text-gray-600">
                {invitedEmails.map((email, index) => (
                  <li key={index}>{email}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              disabled={loading}
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={loading || !email}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Enviando...
                </>
              ) : (
                "Invitar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteModalV2;
