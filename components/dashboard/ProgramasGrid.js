import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Confetti from "react-confetti";
import OnboardingForm from "./OnboardingForm";

function Toast({ show, message, onClose, isError }) {
  if (!show) return null;
  return (
    <div
      className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        isError ? "bg-red-600" : "bg-green-500"
      } text-white`}
    >
      <div className="flex items-center">
        <span className="mr-2">{isError ? "❌" : "✅"}</span>
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function ProgramasGrid({
  programas,
  columns,
  katalystId,
  userName,
}) {
  const { data: session } = useSession();
  const router = useRouter();

  // Estados para el formulario de aplicación
  const [showForm, setShowForm] = useState(false);
  const [formPrograma, setFormPrograma] = useState(null);
  const [formEnviado, setFormEnviado] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isErrorToast, setIsErrorToast] = useState(false);

  // Estados para el status de aplicaciones
  const [yaAplico, setYaAplico] = useState(false);
  const [aplicadoBoardId, setAplicadoBoardId] = useState(null);
  const [aplicacionInfo, setAplicacionInfo] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Estados para el formulario de onboarding
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const [selectedPrograma, setSelectedPrograma] = useState(null);

  // Lógica para abrir el popup de formulario de aplicación
  function handleOpenApplicationForm(prog) {
    // Asegurar que el programa tenga el boardId
    const boardIdCol = columns.find((c) => c.title === "Board destino");
    const boardId = boardIdCol ? prog[boardIdCol.id] : null;

    // Agregar el boardId al programa para que esté disponible en el formulario
    const programaConBoardId = {
      ...prog,
      boardId: boardId,
    };

    setFormPrograma(programaConBoardId);
    setShowForm(true);
    setFormEnviado(false);
  }

  function handleCloseForm() {
    setShowForm(false);
    setFormPrograma(null);
    setFormEnviado(false);
  }

  // Lógica para abrir el formulario de onboarding
  const handleOpenOnboardingForm = (programa) => {
    setSelectedPrograma(programa);
    setShowOnboardingForm(true);
  };

  const handleOnboardingSuccess = () => {
    setShowOnboardingForm(false);
    setSelectedPrograma(null);
    // Recargar el status
    window.location.reload();
  };

  // Consultar si el usuario ya aplicó y obtener el status
  useEffect(() => {
    async function checkAplicaciones() {
      if (!katalystId) return;

      try {
        // Verificar solo programas de tipo "formulario"
        for (const prog of programas) {
          const boardIdCol = columns.find((c) => c.title === "Board destino");
          const boardId = boardIdCol ? prog[boardIdCol.id] : null;
          const tipoCol = columns.find((c) => c.title === "Tipo");
          const tipo = tipoCol ? prog[tipoCol.id] : "formulario";

          // Solo verificar programas de tipo "formulario" que tengan boardId
          if (tipo === "formulario" && boardId) {
            const res = await fetch(
              `/api/registro/person-status?katalystId=${katalystId}&boardId=${boardId}`
            );
            const data = await res.json();

            if (data.success && data.encontrado) {
              setYaAplico(true);
              setAplicadoBoardId(boardId);
              setAplicacionInfo({
                boardId: boardId,
                boardName: data.boardName,
                itemId: data.itemId,
                itemName: data.itemName,
                status: data.status,
                tieneOnboarding: data.tieneOnboarding,
                tieneRazon: data.tieneRazon,
                subitems: data.subitems,
              });
              break;
            }
          }
        }
      } catch (e) {
        console.error("Error al consultar aplicaciones:", e);
      }
    }
    checkAplicaciones();
  }, [katalystId, programas, columns]);

  // Función para enviar el formulario
  async function handleSubmitForm(e) {
    e.preventDefault();
    if (!formPrograma) return;

    // Usar el boardId que ya está en formPrograma
    const boardId = formPrograma.boardId;

    if (!boardId) {
      setToastMessage(
        "Error: Este programa no está configurado para aplicaciones."
      );
      setShowToast(true);
      setIsErrorToast(true);
      return;
    }

    if (!katalystId) {
      setToastMessage(
        "Error: No se encontró tu ID de usuario. Por favor, inicia sesión nuevamente."
      );
      setShowToast(true);
      setIsErrorToast(true);
      return;
    }

    console.log(`[DEBUG] Enviando aplicación:`, {
      boardId,
      katalystId,
      programa: formPrograma.nombre,
    });

    setLoading(true);
    try {
      const formData = new FormData(e.target);
      const data = {
        katalystId: katalystId,
        userName: userName,
        programa: formPrograma.nombre,
        boardId: boardId,
        ...Object.fromEntries(formData),
      };

      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        setFormEnviado(true);
        setShowConfetti(true);
        setToastMessage("¡Aplicación enviada exitosamente!");
        setShowToast(true);
        setIsErrorToast(false);

        setTimeout(() => {
          setShowConfetti(false);
          handleCloseForm();
          window.location.reload();
        }, 3000);
      } else {
        if (result.error && result.error.includes("ya registrado")) {
          setToastMessage(
            "Ya has aplicado a este programa anteriormente. No puedes aplicar dos veces."
          );
        } else {
          setToastMessage(`Error: ${result.error}`);
        }
        setShowToast(true);
        setIsErrorToast(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }
    } catch (error) {
      console.error("Error al enviar formulario:", error);
      setToastMessage("Error de servidor. Intenta de nuevo más tarde.");
      setShowToast(true);
      setIsErrorToast(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    } finally {
      setLoading(false);
    }
  }

  // Debug: mostrar información en desarrollo
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[DEBUG] ProgramasGrid recibió ${programas?.length || 0} programas`
    );
    console.log(`[DEBUG] KatalystId: ${katalystId}`);
    console.log(`[DEBUG] UserName: ${userName}`);
  }

  // Buscar los IDs de las columnas relevantes
  const portadaCol = columns.find((c) => c.title?.toLowerCase() === "portada");
  const familiaCol = columns.find((c) =>
    c.title?.toLowerCase().includes("familia donadora")
  );

  if (!katalystId) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500">
          <svg
            className="w-12 h-12 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p className="text-lg font-semibold">Error de configuración</p>
          <p className="text-sm">
            No se pudo obtener tu ID de Katalyst. Por favor, contacta al
            administrador.
          </p>
        </div>
      </div>
    );
  }

  if (!programas || programas.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-lg font-semibold">No hay programas disponibles</p>
          <p className="text-sm">
            Los programas aparecerán aquí cuando estén disponibles
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {programas.map((prog, index) => {
          // Obtener valores de columnas
          const boardIdCol = columns.find((c) => c.title === "Board destino");
          const boardId = boardIdCol ? prog[boardIdCol.id] : null;
          const descripcionCol = columns.find((c) => c.title === "Descripción");
          const descripcion = descripcionCol
            ? prog[descripcionCol.id]
            : "Sin descripción";
          const tipoCol = columns.find((c) => c.title === "Tipo");
          const tipo = tipoCol ? prog[tipoCol.id] : "formulario";
          const rutaCol = columns.find((c) => c.title === "Ruta destino");
          const rutaDestino = rutaCol ? prog[rutaCol.id] : "";

          // Portada e info de familia donadora
          const portada = portadaCol ? prog[portadaCol.id] : null;
          const familiaDonadora = familiaCol ? prog[familiaCol.id] : null;

          // Botón
          let btnText = "Ver más";
          let btnHref = rutaDestino || "#";

          // Render de la tarjeta
          return (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg border overflow-hidden flex flex-col h-full"
            >
              {/* Banner superior */}
              <div className="bg-purple-500 text-white text-center py-2 px-4 font-semibold text-sm rounded-t-2xl">
                {familiaDonadora
                  ? `Sección donada por la familia ${familiaDonadora}`
                  : "Sección donada por una familia"}
              </div>
              {/* Imagen */}
              {portada ? (
                <img
                  src={portada}
                  alt={prog.nombre}
                  className="object-cover w-full h-40"
                  style={{
                    borderTopLeftRadius: "1rem",
                    borderTopRightRadius: "1rem",
                  }}
                />
              ) : (
                <div
                  className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-400 text-4xl"
                  style={{
                    borderTopLeftRadius: "1rem",
                    borderTopRightRadius: "1rem",
                  }}
                >
                  <span>🚀</span>
                </div>
              )}
              {/* Contenido */}
              <div className="flex-1 flex flex-col p-6">
                <h3 className="text-xl font-bold mb-2">{prog.nombre}</h3>
                <p className="text-gray-600 mb-4">{descripcion}</p>
                <div className="mt-auto">
                  <a
                    href={btnHref}
                    className="w-full block text-center bg-gray-900 hover:bg-gray-800 text-white font-bold uppercase py-3 rounded-b-2xl tracking-wide transition-colors duration-200 shadow-sm"
                    style={{ letterSpacing: "0.05em", fontSize: "1rem" }}
                  >
                    {btnText}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Popup de formulario */}
      {showForm && formPrograma && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={handleCloseForm}
            >
              ×
            </button>

            <h3 className="text-xl font-bold mb-4">Aplicar al Programa</h3>
            <p className="mb-4 text-gray-700">
              Hola <b>{userName}</b>, estás aplicando al programa{" "}
              <b>{formPrograma.nombre}</b>.
            </p>

            {formEnviado ? (
              <div className="text-center">
                <div className="text-green-600 mb-4">
                  <svg
                    className="w-12 h-12 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p className="text-lg font-semibold">¡Aplicación enviada!</p>
                  <p className="text-sm">
                    Te notificaremos cuando se revise tu aplicación
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Por qué quieres participar en este programa? *
                  </label>
                  <textarea
                    name="razon"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    placeholder="Cuéntanos por qué quieres participar en este programa..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esta información nos ayuda a conocerte mejor y evaluar tu
                    aplicación.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-blue-600 mt-0.5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">¿Qué pasa después?</p>
                      <p className="mt-1">1. Revisamos tu aplicación</p>
                      <p>2. Te contactamos para una entrevista</p>
                      <p>3. Te confirmamos si fuiste aceptado</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
                  >
                    {loading && (
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                    )}
                    {loading ? "Enviando..." : "Enviar Aplicación"}
                  </button>
                </div>
              </form>
            )}

            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 text-xs text-gray-500">
                <strong>Debug:</strong> Katalyst ID: {katalystId}
                <br />
                <strong>Board ID:</strong> {formPrograma.boardId}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulario de onboarding */}
      {showOnboardingForm && selectedPrograma && (
        <OnboardingForm
          programa={selectedPrograma}
          katalystId={katalystId}
          userName={userName}
          onClose={() => {
            setShowOnboardingForm(false);
            setSelectedPrograma(null);
          }}
          onSuccess={handleOnboardingSuccess}
        />
      )}

      <Toast
        show={showToast}
        message={toastMessage}
        isError={isErrorToast}
        onClose={() => setShowToast(false)}
      />

      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      {/* Debug Info (solo en desarrollo) */}
      {/*
      {process.env.NODE_ENV === "development" && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-600">
          <strong>Debug Info:</strong>
          <br />
          Katalyst ID: {katalystId}
          <br />
          Ya aplicó: {yaAplico ? "Sí" : "No"}
          <br />
          Board aplicado: {aplicadoBoardId}
          <br />
          Status: {aplicacionInfo?.status || "N/A"}
        </div>
      )}
      */}
    </div>
  );
}
