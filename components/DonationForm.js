"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FaHeart, FaCreditCard, FaCalendarAlt, FaGift } from "react-icons/fa";

const DONATION_AMOUNTS = [
  { value: 50, label: "$50 MXN" },
  { value: 100, label: "$100 MXN" },
  { value: 250, label: "$250 MXN" },
  { value: 500, label: "$500 MXN" },
  { value: 1000, label: "$1,000 MXN" },
  { value: 2500, label: "$2,500 MXN" },
];

const RECURRING_AMOUNTS = [
  { value: 100, label: "$100 MXN/mes" },
  { value: 250, label: "$250 MXN/mes" },
  { value: 500, label: "$500 MXN/mes" },
  { value: 1000, label: "$1,000 MXN/mes" },
];

export default function DonationForm() {
  const { data: session } = useSession();
  const [donationType, setDonationType] = useState("one-time");
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorMessage, setDonorMessage] = useState("");

  // Usar el email del usuario logueado
  useEffect(() => {
    if (session?.user?.email) {
      setDonorEmail(session.user.email);
    }
    if (session?.user?.name) {
      setDonorName(session.user.name);
    }
  }, [session]);

  const handleDonation = async () => {
    setIsLoading(true);

    try {
      const amount = customAmount ? parseFloat(customAmount) : selectedAmount;

      if (!amount || amount <= 0) {
        alert("Por favor ingresa un monto válido");
        return;
      }

      if (!donorName.trim()) {
        alert("Por favor ingresa tu nombre");
        return;
      }

      if (!donorEmail.trim()) {
        alert("Por favor ingresa tu email");
        return;
      }

      // Crear la sesión de checkout
      const response = await fetch("/api/stripe/create-donation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          type: donationType,
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim(),
          donorMessage: donorMessage.trim(),
          successUrl: `${window.location.origin}/donar/gracias`,
          cancelUrl: `${window.location.origin}/donar`,
          userId: session?.user?.id, // Incluir el ID del usuario si está logueado
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirigir a Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Error al procesar la donación:", error);
      alert(
        "Hubo un error al procesar tu donación. Por favor intenta de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const amounts =
    donationType === "one-time" ? DONATION_AMOUNTS : RECURRING_AMOUNTS;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <FaHeart className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {donationType === "one-time"
            ? "Donación Única"
            : "Donación Recurrente"}
        </h2>
        <p className="text-gray-600">
          {donationType === "one-time"
            ? "Apoya nuestro propósito de guiar a las personas a alcanzar su máximo potencial"
            : "Únete a nuestra misión de transformar vidas a través de la sustentabilidad económica"}
        </p>
      </div>

      {/* Tipo de donación */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tipo de donación
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDonationType("one-time")}
            className={`p-4 rounded-lg border-2 transition-all ${
              donationType === "one-time"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <FaGift className="w-5 h-5 mx-auto mb-2" />
            <span className="font-medium">Donación Única</span>
          </button>
          <button
            type="button"
            onClick={() => setDonationType("recurring")}
            className={`p-4 rounded-lg border-2 transition-all ${
              donationType === "recurring"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <FaCalendarAlt className="w-5 h-5 mx-auto mb-2" />
            <span className="font-medium">Donación Mensual</span>
          </button>
        </div>
      </div>

      {/* Montos sugeridos */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Selecciona un monto
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {amounts.map((amount) => (
            <button
              key={amount.value}
              type="button"
              onClick={() => {
                setSelectedAmount(amount.value);
                setCustomAmount("");
              }}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedAmount === amount.value && !customAmount
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="font-medium">{amount.label}</span>
            </button>
          ))}
        </div>

        {/* Monto personalizado */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            $
          </span>
          <input
            type="number"
            placeholder="Otro monto"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedAmount(0);
            }}
            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
            step="0.01"
          />
        </div>
      </div>

      {/* Información del donador */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre completo *
          </label>
          <input
            type="text"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tu nombre completo"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="tu@email.com"
            required
            readOnly={!!session?.user?.email} // Solo lectura si está logueado
          />
          {session?.user?.email && (
            <p className="text-xs text-gray-500 mt-1">
              Usando tu email de perfil: {session.user.email}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mensaje (opcional)
          </label>
          <textarea
            value={donorMessage}
            onChange={(e) => setDonorMessage(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="¿Por qué decides apoyar a Katalyst? (opcional)"
            rows="3"
          />
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-2">
          Resumen de tu donación
        </h3>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Tipo:</span>
            <span className="font-medium">
              {donationType === "one-time"
                ? "Donación única"
                : "Donación mensual"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Monto:</span>
            <span className="font-medium">
              ${customAmount || selectedAmount} MXN
              {donationType === "recurring" && "/mes"}
            </span>
          </div>
        </div>
      </div>

      {/* Botón de donación */}
      <button
        onClick={handleDonation}
        disabled={isLoading}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Procesando...
          </>
        ) : (
          <>
            <FaCreditCard className="w-5 h-5" />
            {donationType === "one-time"
              ? "Donar Ahora"
              : "Iniciar Donación Mensual"}
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        Tus datos están seguros. Utilizamos Stripe para procesar los pagos de
        forma segura.
      </p>
    </div>
  );
}
