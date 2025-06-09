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
        const index = Object.values(labels).findIndex(
          (label) => label === formValue
        );
        return index !== -1 ? { index } : null;
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
    case "text":
    case "long_text":
    case "phone":
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
        // Obtener el boardId de una empresa existente del usuario
        const res = await fetch(
          `/api/user/profile?email=${session.user.email}`
        );
        const user = await res.json();
        const ids = user.businessMondayId || [];
        let boardIdToUse = null;
        if (ids.length > 0) {
          // Obtener el boardId de la primera empresa
          const firstQuery = `query { items (ids: [${ids[0]}]) { board { id } } }`;
          const firstRes = await fetch("/api/monday/item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: firstQuery }),
          });
          const firstData = await firstRes.json();
          boardIdToUse = firstData?.data?.items?.[0]?.board?.id;
        } else {
          // Si no hay empresas, pide el board principal (ajusta el ID si es necesario)
          boardIdToUse = process.env.NEXT_PUBLIC_DEFAULT_BOARD_ID || "";
        }
        setBoardId(boardIdToUse);
        // Obtener columnas del board
        const query = `query { boards(ids: [${boardIdToUse}]) { columns { id title type settings_str } } }`;
        const response = await fetch("/api/monday/item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const data = await response.json();
        setColumns(data?.data?.boards?.[0]?.columns || []);
      } catch (e) {
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
      // Validar y construir column_values
      const columnValues = {};
      const camposMostrar = columns.filter(
        (col) =>
          !["subitems", "person"].includes(col.type?.toLowerCase() || "") &&
          !["Subitems", "Person", "Name", "Name:"].includes(
            col.title?.trim() || ""
          ) &&
          col.id !== "board_relation_mkrcrrm"
      );
      camposMostrar.forEach((col) => {
        if (["status", "dropdown"].includes(col.type)) {
          if (col.settings_str) {
            const labels = Object.values(
              JSON.parse(col.settings_str).labels || {}
            );
            if (!labels.includes(form[col.id])) {
              throw new Error(
                `El valor '${form[col.id]}' no es válido para la columna '${
                  col.title
                }'. Opciones válidas: ${labels.join(", ")}`
              );
            }
          }
        }
        const value = getColumnValue(col, form[col.id]);
        if (value !== null) {
          columnValues[col.id] = value;
        }
      });
      // Crear empresa en Monday
      const mutation = `mutation { create_item (board_id: ${boardId}, item_name: "${
        form.name || "Nueva Empresa"
      }", column_values: ${JSON.stringify(
        JSON.stringify(columnValues)
      )}) { id } }`;
      const response = await fetch("/api/monday/item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: mutation }),
      });
      const data = await response.json();
      const newId = data?.data?.create_item?.id;
      if (!newId) throw new Error("No se pudo crear la empresa en Monday");
      // 1. Actualizar MongoDB
      const userRes = await fetch(
        `/api/user/profile?email=${session.user.email}`
      );
      const user = await userRes.json();
      const newBusinessIds = [...(user.businessMondayId || []), newId];
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
        console.error("MongoDB update failed:", mongoError);
        setError(`MongoDB update failed: ${mongoError}`);
        toast.error("No se pudo asociar la empresa al usuario en MongoDB");
        throw new Error("MongoDB update failed: " + mongoError);
      }
      // 2. Asociar usuario en Monday (contactos - digitalización)
      if (newId && user.personalMondayId && boardId) {
        const mutation = `mutation { change_multiple_column_values (board_id: ${boardId}, item_id: ${newId}, column_values: "{ \\\"board_relation_mkrcrrm\\\": {\\\"item_ids\\\":[${user.personalMondayId}]} }", create_labels_if_missing: false) { id } }`;
        const mondayRes = await fetch("/api/monday/item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: mutation }),
        });
        if (!mondayRes.ok) {
          const mondayError = await mondayRes.text();
          console.error("Monday contact update failed:", mondayError);
          setError(`Monday contact update failed: ${mondayError}`);
          toast.error("No se pudo asociar el usuario como contacto en Monday");
          throw new Error("Monday contact update failed: " + mondayError);
        }
      }
      setNewEmpresaId(newId);
      setShowInviteModal(true);
      // No redirigir aún
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
      console.error("Error en creación de empresa:", e);
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
    if (["subitems", "person"].includes(col.type)) return null;
    switch (col.type) {
      case "status":
      case "dropdown":
        if (col.settings_str) {
          const labels = JSON.parse(col.settings_str).labels || {};
          return (
            <select
              className="input input-bordered w-full max-w-xs"
              value={form[col.id] || ""}
              onChange={(e) => handleChange(col, e.target.value)}
            >
              <option value="">Selecciona una opción</option>
              {Object.values(labels).map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          );
        }
        return null;
      case "date":
        return (
          <input
            type="date"
            className="input input-bordered w-full max-w-xs"
            value={form[col.id] || ""}
            onChange={(e) => handleChange(col, e.target.value)}
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
          />
        );
      case "phone":
        return (
          <input
            type="tel"
            className="input input-bordered w-full max-w-xs"
            value={form[col.id] || ""}
            onChange={(e) => handleChange(col, e.target.value)}
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
            placeholder={`Ingresa ${col.title.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">Agregar Empresa</h1>
      <div className="bg-white rounded shadow p-6 mb-6">
        {loading && <p className="text-center">Cargando...</p>}
        {error && (
          <div className="bg-red-100 text-red-800 p-2 rounded mb-4 text-xs">
            <pre>{error}</pre>
          </div>
        )}
        {!loading && (
          <form onSubmit={handleSave} className="space-y-4 max-w-md mx-auto">
            {camposMostrar.map((col) => (
              <div
                key={col.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm mb-2 gap-2 py-1"
              >
                <span className="font-medium flex items-center gap-2 min-w-[120px]">
                  {ICONOS_TIPOS[col.type] || (
                    <FaBuilding className="text-gray-600" />
                  )}
                  {col.title}:
                </span>
                {renderField(col)}
              </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-2 justify-end mt-4">
              <button
                type="button"
                className="btn btn-ghost min-w-[100px]"
                onClick={() => router.push("/dashboard/empresas")}
                disabled={saving}
                aria-label="Cancelar creación de empresa"
              >
                <FaTimes className="inline mr-1" /> Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary min-w-[140px]"
                disabled={saving}
                aria-label="Guardar empresa"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <FaCheck className="inline" /> Guardando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FaCheck className="inline" /> Guardar Empresa
                  </span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
      {/* Modal de invitación */}
      {showInviteModal && (
        <InviteModalV2
          onClose={() => setShowInviteModal(false)}
          empresaId={newEmpresaId}
          empresaNombre={form.name || ""}
          invitadorNombre={invitadorNombre}
        />
      )}
    </div>
  );
}
