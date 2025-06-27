"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FaBuilding,
  FaCheck,
  FaTimes,
  FaGlobe,
  FaMapMarkerAlt,
  FaPhone,
  FaInfoCircle,
  FaCalendarAlt,
  FaLink,
  FaHashtag,
  FaCheckSquare,
  FaList,
  FaClock,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import InviteModalV2 from "@/components/InviteModalV2";

const ICONOS_TIPOS = {
  text: <FaGlobe className="text-blue-600" />,
  location: <FaMapMarkerAlt className="text-red-600" />,
  phone: <FaPhone className="text-green-600" />,
  long_text: <FaInfoCircle className="text-purple-600" />,
  status: <FaBuilding className="text-yellow-600" />,
  date: <FaCalendarAlt className="text-orange-600" />,
  link: <FaLink className="text-indigo-600" />,
  numbers: <FaHashtag className="text-pink-600" />,
  checkbox: <FaCheckSquare className="text-teal-600" />,
  dropdown: <FaList className="text-cyan-600" />,
  time_tracking: <FaClock className="text-gray-600" />,
};

function getColumnValue(col, formValue) {
  if (!formValue) return null;
  switch (col.type) {
    case "status":
    case "dropdown": {
      if (col.settings_str) {
        const labels = JSON.parse(col.settings_str).labels || {};
        const index = Object.entries(labels).find(
          ([, v]) => (typeof v === "object" ? v.name : v) === formValue
        )?.[0];
        return index !== undefined ? { index: parseInt(index) } : null;
      }
      return null;
    }
    case "location":
      return { address: formValue, lat: null, lng: null };
    case "date":
      return { date: formValue };
    case "numbers":
      return { number: parseFloat(formValue) };
    case "checkbox":
      return { checked: formValue === "true" };
    case "phone":
      return {
        phone: formValue,
        countryShortName: "MX",
      };
    case "text":
    case "long_text":
    case "link":
      return String(formValue);
    default:
      return formValue;
  }
}

export default function NuevaEmpresa() {
  const { data: session } = useSession();
  const router = useRouter();
  const [boardId, setBoardId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newEmpresaId, setNewEmpresaId] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const emailInputRef = useRef(null);
  const [invitadorNombre, setInvitadorNombre] = useState("");

  useEffect(() => {
    const fetchBoard = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("[NuevaEmpresa] Obteniendo board de empresas");

        // Usar el board ID de empresas correcto
        const boardIdToUse = "9254006168"; // Board de Empresas
        console.log("[NuevaEmpresa] Board ID a usar:", boardIdToUse);

        setBoardId(boardIdToUse);

        // Obtener columnas del board
        const query = `query { 
          boards(ids: [${boardIdToUse}]) { 
            id
            name
            columns { 
              id 
              title 
              type 
              settings_str 
            } 
          } 
        }`;

        console.log("[NuevaEmpresa] Query para obtener columnas:", query);

        const response = await fetch("/api/monday/item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        const data = await response.json();
        console.log("[NuevaEmpresa] Respuesta de Monday:", data);

        if (!response.ok || data.errors) {
          throw new Error(
            "Error al obtener estructura del board: " +
              (data.errors?.[0]?.message || "Error desconocido")
          );
        }

        const board = data?.data?.boards?.[0];
        if (!board) {
          throw new Error("No se encontró el board de empresas");
        }

        console.log("[NuevaEmpresa] Board encontrado:", board.name);
        console.log(
          "[NuevaEmpresa] Columnas encontradas:",
          board.columns?.length || 0
        );

        setColumns(board.columns || []);
      } catch (e) {
        console.error("[NuevaEmpresa] Error al obtener board:", e);
        setError(e.message);
      }
      setLoading(false);
    };
    if (session?.user?.email) fetchBoard();
  }, [session?.user?.email]);

  useEffect(() => {
    // Al cargar la página, buscar el nombre real del usuario en Monday
    const fetchInvitadorNombre = async () => {
      if (session?.user?.email) {
        const res = await fetch(
          `/api/user/profile?email=${session.user.email}`
        );
        const user = await res.json();
        if (user.personalMondayId) {
          const query = `query { items (ids: [${user.personalMondayId}]) { id name } }`;
          const mondayRes = await fetch("/api/monday/item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
          });
          const data = await mondayRes.json();
          setInvitadorNombre(data?.data?.items?.[0]?.name || "");
        }
      }
    };
    fetchInvitadorNombre();
  }, [session?.user?.email]);

  const handleChange = (col, value) => {
    setForm((f) => ({ ...f, [col.id]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      console.log("[NuevaEmpresa] Iniciando creación de empresa");
      console.log("[NuevaEmpresa] Board ID:", boardId);
      console.log("[NuevaEmpresa] Form data:", form);

      // Validar que tenemos un boardId
      if (!boardId) {
        throw new Error("No se pudo obtener el ID del board de empresas");
      }

      // Validar y construir column_values
      const columnValues = {};
      const camposMostrar = columns.filter(
        (col) =>
          col &&
          col.id &&
          col.title &&
          !["subitems", "person"].includes(col.type?.toLowerCase() || "") &&
          !["Subitems", "Person", "Name", "Name:"].includes(
            col.title?.trim() || ""
          ) &&
          col.id !== "board_relation_mkrcrrm"
      );

      console.log("[NuevaEmpresa] Campos a procesar:", camposMostrar);

      camposMostrar.forEach((col) => {
        const value = getColumnValue(col, form[col.id]);
        if (value !== null) {
          columnValues[col.id] = value;
          console.log(`[NuevaEmpresa] Agregando campo ${col.title}:`, value);
        }
      });

      console.log("[NuevaEmpresa] Column values final:", columnValues);

      // Crear empresa en Monday
      const mutation = `mutation { 
        create_item (
          board_id: ${boardId}, 
          item_name: "${form.name || "Nueva Empresa"}", 
          column_values: "${JSON.stringify(columnValues).replace(/"/g, '\\"')}"
        ) { 
          id 
        } 
      }`;

      console.log("[NuevaEmpresa] Mutation:", mutation);

      const response = await fetch("/api/monday/item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: mutation }),
      });

      const data = await response.json();
      console.log("[NuevaEmpresa] Respuesta de Monday:", data);

      if (!response.ok || data.errors) {
        throw new Error(
          "Error al crear empresa en Monday.com: " +
            (data.errors?.[0]?.message || data.error || "Error desconocido")
        );
      }

      const newId = data?.data?.create_item?.id;
      if (!newId) {
        throw new Error("No se pudo crear la empresa en Monday.com");
      }

      console.log("[NuevaEmpresa] Empresa creada con ID:", newId);

      // 1. Actualizar MongoDB
      const userRes = await fetch(
        `/api/user/profile?email=${session.user.email}`
      );
      const user = await userRes.json();
      const newBusinessIds = [...(user.businessMondayId || []), newId];

      console.log(
        "[NuevaEmpresa] Actualizando MongoDB con business IDs:",
        newBusinessIds
      );

      const mongoRes = await fetch(`/api/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          businessMondayId: newBusinessIds,
        }),
      });

      if (!mongoRes.ok) {
        const mongoError = await mongoRes.text();
        console.error("[NuevaEmpresa] MongoDB update failed:", mongoError);
        throw new Error(`Error al actualizar MongoDB: ${mongoError}`);
      }

      console.log("[NuevaEmpresa] MongoDB actualizado correctamente");

      // 2. Asociar usuario en Monday (contactos - digitalización)
      if (newId && user.personalMondayId && boardId) {
        console.log("[NuevaEmpresa] Asociando usuario como contacto en Monday");

        const contactMutation = `mutation { 
          change_multiple_column_values (
            board_id: ${boardId}, 
            item_id: ${newId}, 
            column_values: "{ \\\"board_relation_mkrcrrm\\\": {\\\"item_ids\\\":[${user.personalMondayId}]} }", 
            create_labels_if_missing: true
          ) { 
            id 
          } 
        }`;

        const mondayRes = await fetch("/api/monday/item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: contactMutation }),
        });

        if (!mondayRes.ok) {
          const mondayError = await mondayRes.text();
          console.error(
            "[NuevaEmpresa] Monday contact update failed:",
            mondayError
          );
          // No fallar si esto falla, solo log
        } else {
          console.log(
            "[NuevaEmpresa] Usuario asociado como contacto correctamente"
          );
        }
      }

      setNewEmpresaId(newId);
      setShowInviteModal(true);
      toast.success("Empresa creada correctamente");
    } catch (e) {
      console.error("[NuevaEmpresa] Error en creación de empresa:", e);
      setError(e.message);
      toast.error(e.message);
    }
    setSaving(false);
  };

  const handleInvite = async () => {
    setInviteLoading(true);
    setInviteError(null);
    try {
      // Aquí deberías implementar la lógica real de invitación
      // Por ahora solo simula éxito
      await new Promise((res) => setTimeout(res, 1000));
      setShowInviteModal(false);
      router.push("/dashboard/empresas");
    } catch (e) {
      setInviteError("Error al invitar: " + e.message);
    }
    setInviteLoading(false);
  };

  const handleSkipInvite = () => {
    setShowInviteModal(false);
    router.push("/dashboard/empresas");
  };

  const renderField = (col) => {
    if (!col || !col.type || ["subitems", "person"].includes(col.type))
      return null;

    const isRequired =
      col.title?.toLowerCase().includes("nombre") ||
      col.title?.toLowerCase().includes("name") ||
      col.id === "name";

    switch (col.type) {
      case "status":
      case "dropdown":
        if (col.settings_str) {
          try {
            const labels = JSON.parse(col.settings_str).labels || {};
            return (
              <select
                className="input input-bordered w-full max-w-xs"
                value={form[col.id] || ""}
                onChange={(e) => handleChange(col, e.target.value)}
                required={isRequired}
              >
                <option value="">Selecciona una opción</option>
                {Object.values(labels).map((label, index) => {
                  const labelStr =
                    typeof label === "object" ? label.name : String(label);
                  return (
                    <option key={`${col.id}-${index}`} value={labelStr}>
                      {labelStr}
                    </option>
                  );
                })}
              </select>
            );
          } catch (error) {
            console.error("[NuevaEmpresa] Error parsing settings_str:", error);
            return null;
          }
        }
        return null;
      case "date":
        return (
          <input
            type="date"
            className="input input-bordered w-full max-w-xs"
            value={form[col.id] || ""}
            onChange={(e) => handleChange(col, e.target.value)}
            required={isRequired}
          />
        );
      case "checkbox":
        return (
          <input
            type="checkbox"
            className="checkbox"
            checked={form[col.id] === "true"}
            onChange={(e) => handleChange(col, e.target.checked.toString())}
          />
        );
      case "numbers":
        return (
          <input
            type="number"
            className="input input-bordered w-full max-w-xs"
            value={form[col.id] || ""}
            onChange={(e) => handleChange(col, e.target.value)}
            required={isRequired}
            placeholder={`Ingresa ${col.title.toLowerCase()}`}
          />
        );
      case "phone":
        return (
          <input
            type="tel"
            className="input input-bordered w-full max-w-xs"
            value={form[col.id] || ""}
            onChange={(e) => handleChange(col, e.target.value)}
            required={isRequired}
            placeholder="Ingresa el teléfono"
          />
        );
      case "location":
        return (
          <input
            type="text"
            className="input input-bordered w-full max-w-xs"
            value={form[col.id] || ""}
            onChange={(e) => handleChange(col, e.target.value)}
            required={isRequired}
            placeholder="Ingresa la dirección"
          />
        );
      case "link":
        return (
          <input
            type="url"
            className="input input-bordered w-full max-w-xs"
            value={form[col.id] || ""}
            onChange={(e) => handleChange(col, e.target.value)}
            required={isRequired}
            placeholder="Ingresa la URL"
          />
        );
      default:
        return (
          <input
            type="text"
            className="input input-bordered w-full max-w-xs"
            value={form[col.id] || ""}
            onChange={(e) => handleChange(col, e.target.value)}
            required={isRequired}
            placeholder={`Ingresa ${col.title.toLowerCase()}`}
          />
        );
    }
  };

  // Definir camposMostrar ANTES del return para evitar errores
  const camposMostrar = columns.filter(
    (col) =>
      col &&
      col.id &&
      col.title &&
      !["subitems", "person"].includes(col.type?.toLowerCase() || "") &&
      !["Subitems", "Person", "Name", "Name:"].includes(
        col.title?.trim() || ""
      ) &&
      col.id !== "board_relation_mkrcrrm"
  );

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-3 text-center">Agregar Empresa</h1>
      <div>
        {loading && <p className="text-center">Cargando...</p>}
        {error && (
          <div className="bg-red-100 text-red-800 p-2 rounded mb-4 text-xs">
            <pre>{error}</pre>
          </div>
        )}
        {!loading && (
          <form
            onSubmit={handleSave}
            className="space-y-4 w-full max-w-lg mx-auto"
          >
            {camposMostrar.map((col) => {
              if (!col || !col.id || !col.title) return null;

              return (
                <div
                  key={col.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm mb-4 gap-3 py-2 border-b border-gray-100"
                >
                  <span className="font-medium flex items-center gap-2 min-w-[140px] text-gray-700">
                    {ICONOS_TIPOS[col.type] || (
                      <FaBuilding className="text-gray-600" />
                    )}
                    {col.title}
                    {(col.title.toLowerCase().includes("nombre") ||
                      col.title.toLowerCase().includes("name") ||
                      col.id === "name") && (
                      <span className="text-red-500 text-xs">*</span>
                    )}
                  </span>
                  <div className="flex-1 max-w-xs">{renderField(col)}</div>
                </div>
              );
            })}
            <div className="flex flex-col sm:flex-row gap-2 justify-end mt-4">
              <button
                type="button"
                className="btn btn-ghost min-w-[100px]"
                onClick={() => router.push("/dashboard/empresas")}
                disabled={saving}
                aria-label="Cancelar creación de empresa"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary min-w-[100px]"
                disabled={saving}
                aria-label="Guardar empresa"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        )}
      </div>
      {/* Modal de Invitar Contacto */}
      {showInviteModal && newEmpresaId && (
        <InviteModalV2
          onClose={() => setShowInviteModal(false)}
          empresaId={newEmpresaId}
          empresaNombre={form.name || "Nueva Empresa"}
          invitadorNombre={invitadorNombre}
        />
      )}
    </div>
  );
}
