"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  FaBuilding,
  FaIdBadge,
  FaEdit,
  FaCheck,
  FaTimes,
  FaUsers,
  FaPlus,
  FaGlobe,
  FaMapMarkerAlt,
  FaPhone,
  FaInfoCircle,
  FaUserPlus,
  FaCalendarAlt,
  FaLink,
  FaHashtag,
  FaCheckSquare,
  FaList,
  FaClock,
} from "react-icons/fa";
import Link from "next/link";
import { toast } from "react-hot-toast";
import InviteModalV2 from "@/components/InviteModalV2";

// Mapeo de iconos por tipo de columna
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

function getStatusInfo(empresa) {
  const statusCol = empresa.column_values?.find(
    (col) => col.column?.type === "status"
  );
  if (!statusCol) return { label: "Sin estado", color: "gray" };

  const labelStyle = statusCol.label_style || {};
  const color =
    labelStyle.color ||
    (statusCol.text?.toLowerCase().includes("activa") ? "#00a562" : "#df2f4a");

  return {
    label: statusCol.text || "Sin estado",
    color: color,
  };
}

function getColumnValue(col, formValue) {
  if (!formValue) return null;

  switch (col.column?.type) {
    case "status":
      return { label: formValue };
    case "dropdown":
      return { labels: [formValue] };
    case "location":
      return {
        address: formValue,
        lat: null,
        lng: null,
      };
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

export default function EmpresasDashboard() {
  const { data: session } = useSession();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [boardStructure, setBoardStructure] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [empresaDetalle, setEmpresaDetalle] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invitadorNombre, setInvitadorNombre] = useState("");

  useEffect(() => {
    const fetchBoardStructure = async (boardId) => {
      try {
        const query = `query { 
          boards(ids: [${boardId}]) { 
            columns { 
              id 
              title 
              type 
              settings_str 
            } 
          } 
        }`;
        const response = await fetch("/api/monday/item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const data = await response.json();
        if (data.errors) throw new Error(data.errors[0].message);
        setBoardStructure(data?.data?.boards?.[0]?.columns || []);
      } catch (e) {
        console.error("Error fetching board structure:", e);
      }
    };

    const fetchEmpresas = async () => {
      if (!session?.user?.email) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/user/profile?email=${session.user.email}`
        );
        const user = await res.json();
        const ids = user.businessMondayId || [];
        if (!ids.length) {
          setEmpresas([]);
          setLoading(false);
          return;
        }

        // Primero obtener una empresa para saber el board_id
        const firstQuery = `query { 
          items (ids: [${ids[0]}]) { 
            board { 
              id 
            } 
          } 
        }`;
        const firstRes = await fetch("/api/monday/item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: firstQuery }),
        });
        const firstData = await firstRes.json();
        const boardId = firstData?.data?.items?.[0]?.board?.id;

        if (boardId) {
          await fetchBoardStructure(boardId);
        }

        // Luego obtener todas las empresas
        const query = `query { 
          items (ids: [${ids.join(",")}]) { 
            id 
            name 
            board { 
              id 
            } 
            column_values { 
              id 
              text 
              value 
              column {
                id 
                title 
                type 
                settings_str 
              }
              ...on StatusValue {
                label
                updated_at
                label_style {
                  color
                }
              }
              ...on BoardRelationValue {
                display_value
              }
              ...on LocationValue {
                address
                lat
                lng
              }
              ...on DateValue {
                date
              }
              ...on NumbersValue {
                number
              }
              ...on CheckboxValue {
                checked
              }
            } 
          } 
        }`;
        const mondayRes = await fetch("/api/monday/item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const mondayData = await mondayRes.json();
        setEmpresas(mondayData?.data?.items || []);
      } catch (e) {
        setError(e.message);
        setEmpresas([]);
      }
      setLoading(false);
    };
    fetchEmpresas();
  }, [session?.user?.email]);

  useEffect(() => {
    if (session?.user?.name) setInvitadorNombre(session.user.name);
    else if (session?.user?.email) setInvitadorNombre(session.user.email);
    else setInvitadorNombre("Alguien del equipo");
  }, [session?.user]);

  const handleEdit = (empresa) => {
    setEditId(empresa.id);
    const initial = {};
    empresa.column_values?.forEach((col) => {
      if (
        !["subitems", "person", "status"].includes(col.column?.type) &&
        col.column?.id !== "board_relation_mkrcrrm"
      ) {
        initial[col.id] = col.text || col.value || "";
      }
    });
    setForm(initial);
  };

  const handleChange = (col, value) => {
    setForm((f) => ({ ...f, [col.id]: value }));
  };

  const handleSave = async (empresa) => {
    setSaving(true);
    try {
      const columnValues = {};
      empresa.column_values.forEach((col) => {
        if (
          !["subitems", "person", "status"].includes(col.column?.type) &&
          col.column?.id !== "board_relation_mkrcrrm"
        ) {
          // Validar status/dropdown
          if (["status", "dropdown"].includes(col.column?.type)) {
            if (col.column?.settings_str) {
              const labels = Object.values(
                JSON.parse(col.column.settings_str).labels || {}
              );
              if (!labels.includes(form[col.id])) {
                throw new Error(
                  `El valor '${form[col.id]}' no es válido para la columna '${
                    col.column?.title
                  }'. Opciones válidas: ${labels.join(", ")}`
                );
              }
            }
          }
          const value = getColumnValue(col, form[col.id]);
          if (value !== null) {
            columnValues[col.id] = value;
          }
        }
      });

      const mutation = `mutation { 
        change_multiple_column_values (
          item_id: ${empresa.id}, 
          board_id: ${empresa.board.id}, 
          column_values: ${JSON.stringify(JSON.stringify(columnValues))}
        ) { 
          id 
        } 
      }`;

      const response = await fetch("/api/monday/item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: mutation }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      setEditId(null);
      setSaving(false);

      // Refrescar empresas
      setLoading(true);
      const ids = empresas.map((e) => e.id);
      const query = `query { 
        items (ids: [${ids.join(",")}]) { 
          id 
          name 
          board { 
            id 
          } 
          column_values { 
            id 
            text 
            value 
            column {
              id 
              title 
              type 
              settings_str 
            }
            ...on StatusValue {
              label
              updated_at
              label_style {
                color
              }
            }
            ...on BoardRelationValue {
              display_value
            }
            ...on LocationValue {
              address
              lat
              lng
            }
            ...on DateValue {
              date
            }
            ...on NumbersValue {
              number
            }
            ...on CheckboxValue {
              checked
            }
          } 
        } 
      }`;

      const mondayRes = await fetch("/api/monday/item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const mondayData = await mondayRes.json();

      if (mondayData.errors) {
        throw new Error(mondayData.errors[0].message);
      }

      setEmpresas(mondayData?.data?.items || []);
      setLoading(false);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const handleInviteContact = (empresa) => {
    setSelectedEmpresa(empresa);
    setShowInviteModal(true);
  };

  const renderField = (col, formValue, isEditing) => {
    if (!isEditing) {
      return <span>{col.text || col.value || "-"}</span>;
    }

    switch (col.column?.type) {
      case "status":
      case "dropdown":
        if (col.column?.settings_str) {
          const labels = JSON.parse(col.column.settings_str).labels || {};
          return (
            <select
              className="input input-bordered w-full max-w-xs"
              value={formValue || ""}
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
            value={formValue || ""}
            onChange={(e) => handleChange(col, e.target.value)}
          />
        );

      case "checkbox":
        return (
          <input
            type="checkbox"
            className="checkbox"
            checked={formValue === "true"}
            onChange={(e) => handleChange(col, e.target.checked.toString())}
          />
        );

      case "numbers":
        return (
          <input
            type="number"
            className="input input-bordered w-full max-w-xs"
            value={formValue || ""}
            onChange={(e) => handleChange(col, e.target.value)}
          />
        );

      case "phone":
        return (
          <input
            type="tel"
            className="input input-bordered w-full max-w-xs"
            value={formValue || ""}
            onChange={(e) => handleChange(col, e.target.value)}
            placeholder="Ingresa el teléfono"
          />
        );

      case "location":
        return (
          <input
            type="text"
            className="input input-bordered w-full max-w-xs"
            value={formValue || ""}
            onChange={(e) => handleChange(col, e.target.value)}
            placeholder="Ingresa la dirección"
          />
        );

      case "link":
        return (
          <input
            type="url"
            className="input input-bordered w-full max-w-xs"
            value={formValue || ""}
            onChange={(e) => handleChange(col, e.target.value)}
            placeholder="Ingresa la URL"
          />
        );

      default:
        return (
          <input
            type="text"
            className="input input-bordered w-full max-w-xs"
            value={formValue || ""}
            onChange={(e) => handleChange(col, e.target.value)}
            placeholder={`Ingresa ${col.column?.title.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold">Empresas</h1>
        <Link href="/dashboard/empresas/nueva">
          <button className="btn btn-primary">
            <FaPlus className="inline mr-2" /> Agregar Empresa
          </button>
        </Link>
      </div>
      <div className="bg-white rounded shadow p-6 mb-6">
        {loading && <p className="text-center">Cargando...</p>}
        {error && <p className="text-red-600 text-center">{error}</p>}
        {!loading && empresas.length === 0 && !error && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No tienes empresas asociadas.</p>
            <Link href="/dashboard/empresas/nueva">
              <button className="btn btn-primary">
                <FaPlus className="inline mr-2" /> Agregar mi primera empresa
              </button>
            </Link>
          </div>
        )}
        {empresas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {empresas.map((empresa) => {
              const statusInfo = getStatusInfo(empresa);
              const contactos = empresa.column_values?.find(
                (col) => col.column?.id === "board_relation_mkrcrrm"
              );
              const numContactos = contactos?.display_value
                ? contactos.display_value.split(", ").length
                : 0;
              // Filtrar campos a mostrar (ni como etiqueta ni como valor)
              const camposMostrar = empresa.column_values?.filter(
                (col) =>
                  !["subitems", "person", "status"].includes(
                    col.column?.type?.toLowerCase() || ""
                  ) &&
                  ![
                    "Subitems",
                    "Person",
                    "Status",
                    "Contactos - Digitalización:",
                    "Contactos - Digitalización",
                  ].includes(col.column?.title?.trim() || "")
              );
              const isEditing = editId === empresa.id;
              return (
                <div
                  key={empresa.id}
                  className="border rounded-xl shadow-lg p-6 bg-white flex flex-col gap-3 hover:shadow-2xl transition-shadow focus-within:ring-2 focus-within:ring-[#233746]"
                  tabIndex={0}
                  aria-label={`Tarjeta de empresa ${empresa.name}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg flex items-center gap-2">
                      <FaBuilding className="text-yellow-600" />
                      {empresa.name}
                    </span>
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: `${statusInfo.color}20`,
                        color: statusInfo.color,
                      }}
                      title={statusInfo.label}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <FaIdBadge /> ID: {empresa.id}
                  </div>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <FaUsers className="text-blue-600" /> {numContactos}{" "}
                    contacto{numContactos === 1 ? "" : "s"}
                  </div>
                  {isEditing ? (
                    <>
                      {camposMostrar.length === 0 && (
                        <div className="text-gray-400 text-sm italic mb-2">
                          No hay campos editables para esta empresa.
                        </div>
                      )}
                      {camposMostrar.map((col) => (
                        <div
                          key={col.id}
                          className="flex justify-between text-sm mb-2"
                        >
                          <span className="font-medium flex items-center gap-2">
                            {ICONOS_TIPOS[col.column?.type] || (
                              <FaBuilding className="text-gray-600" />
                            )}
                            {col.column?.title}:
                          </span>
                          {renderField(col, form[col.id], true)}
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <button
                          className="btn btn-success"
                          onClick={() => handleSave(empresa)}
                          disabled={saving}
                        >
                          <FaCheck className="inline mr-1" /> Guardar
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => setEditId(null)}
                          disabled={saving}
                        >
                          <FaTimes className="inline mr-1" /> Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {camposMostrar.length === 0 && (
                        <div className="text-gray-400 text-sm italic mb-2">
                          No hay información relevante para mostrar.
                        </div>
                      )}
                      {camposMostrar.map((col) => (
                        <div
                          key={col.id}
                          className="flex justify-between text-sm mb-2 border-b pb-1 last:border-b-0 last:pb-0"
                        >
                          <span className="font-medium flex items-center gap-2">
                            {ICONOS_TIPOS[col.column?.type] || (
                              <FaBuilding className="text-gray-600" />
                            )}
                            {col.column?.title}:
                          </span>
                          <span>
                            {col.text || col.value || (
                              <span className="text-gray-300">-</span>
                            )}
                          </span>
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <button
                          className="btn btn-sm btn-outline min-w-[90px]"
                          onClick={() => {
                            setEmpresaDetalle(empresa);
                            setShowInfoModal(true);
                          }}
                          aria-label="Ver información de la empresa"
                        >
                          Ver info
                        </button>
                        <button
                          className="btn btn-sm btn-primary min-w-[90px]"
                          onClick={() => handleEdit(empresa)}
                          aria-label="Editar empresa"
                        >
                          <FaEdit className="inline mr-1" /> Editar
                        </button>
                        <button
                          className="btn btn-sm btn-primary min-w-[90px]"
                          onClick={() => handleInviteContact(empresa)}
                          aria-label="Invitar contacto a empresa"
                        >
                          <FaUserPlus className="inline mr-1" /> Invitar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-800 p-2 rounded mb-4 text-xs">
            <pre>{error}</pre>
          </div>
        )}
      </div>

      {/* Modal de Invitar Contacto */}
      {showInviteModal && selectedEmpresa && (
        <InviteModalV2
          onClose={() => setShowInviteModal(false)}
          empresaId={selectedEmpresa.id}
          empresaNombre={selectedEmpresa.name}
          invitadorNombre={invitadorNombre}
        />
      )}

      {/* Modal de detalles de empresa */}
      {showInfoModal && empresaDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">
              Detalles de {empresaDetalle.name}
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {empresaDetalle.column_values
                ?.filter(
                  (col) =>
                    !["subitems", "person", "status"].includes(
                      col.column?.type?.toLowerCase() || ""
                    ) &&
                    ![
                      "Subitems",
                      "Person",
                      "Status",
                      "Contactos - Digitalización:",
                      "Contactos - Digitalización",
                    ].includes(col.column?.title?.trim() || "")
                )
                .map((col) => (
                  <div
                    key={col.id}
                    className="flex justify-between text-sm border-b pb-1"
                  >
                    <span className="font-medium flex items-center gap-2">
                      {ICONOS_TIPOS[col.column?.type] || (
                        <FaBuilding className="text-gray-600" />
                      )}
                      {col.column?.title}:
                    </span>
                    <span>
                      {col.text || col.value || (
                        <span className="text-gray-300">-</span>
                      )}
                    </span>
                  </div>
                ))}
              {empresaDetalle.column_values?.filter(
                (col) =>
                  !["subitems", "person", "status"].includes(
                    col.column?.type?.toLowerCase() || ""
                  ) &&
                  ![
                    "Subitems",
                    "Person",
                    "Status",
                    "Contactos - Digitalización:",
                    "Contactos - Digitalización",
                  ].includes(col.column?.title?.trim() || "")
              ).length === 0 && (
                <div className="text-gray-400 text-sm italic">
                  No hay información relevante para mostrar.
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn btn-ghost"
                onClick={() => setShowInfoModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
