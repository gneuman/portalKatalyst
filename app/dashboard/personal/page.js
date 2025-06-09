"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import {
  FaUser,
  FaPhone,
  FaCalendarAlt,
  FaEnvelope,
  FaUsers,
  FaVenusMars,
  FaBuilding,
} from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import ImageUpload from "@/components/ImageUpload";

const CAMPOS = [
  { title: "Nombre", icon: <FaUser className="text-blue-600" /> },
  { title: "Apellido Paterno", icon: <FaUser className="text-blue-600" /> },
  { title: "Apellido Materno", icon: <FaUser className="text-blue-600" /> },
  { title: "Teléfono", icon: <FaPhone className="text-green-600" /> },
  {
    title: "Fecha Nacimiento",
    icon: <FaCalendarAlt className="text-purple-600" />,
  },
  { title: "Comunidad", icon: <FaUsers className="text-yellow-600" /> },
  { title: "Género", icon: <FaVenusMars className="text-pink-600" /> },
  { title: "Email", icon: <FaEnvelope className="text-gray-600" /> },
];

export default function PerfilPersonal() {
  const { data: session } = useSession();
  const profileCache = useRef(null);
  const [profile, setProfile] = useState(null);
  const [columns, setColumns] = useState([]); // Para status y date
  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [empresas, setEmpresas] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.email) return;
      setLoading(true);
      setError(null);
      try {
        // 1. Buscar usuario en MongoDB
        const res = await fetch(
          `/api/user/profile?email=${session.user.email}`
        );
        const user = await res.json();
        // Guardar mongoId en localStorage
        if (user._id) {
          localStorage.setItem("mongoId", user._id);
        }
        if (!user.personalMondayId)
          throw new Error("No se encontró personalMondayId");
        // 2. Traer datos de Monday
        const query = `query { items (ids: [${user.personalMondayId}]) { id name board { id } column_values { id text value column { id title type settings_str } } } }`;
        const mondayRes = await fetch("/api/monday/item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const mondayData = await mondayRes.json();
        const item = mondayData?.data?.items?.[0] || null;
        profileCache.current = item; // Guardar en caché
        setProfile(item);
        // Guardar columnas para edición
        setColumns(item?.column_values?.map((col) => col.column) || []);
        // Inicializar form
        const initial = {};
        item?.column_values?.forEach((col) => {
          initial[col.column?.title] = col.text || col.value || "";
        });
        initial["Email"] = session.user.email;
        setForm(initial);
        // Empresas asociadas
        if (user.businessMondayId && user.businessMondayId.length > 0) {
          const empresasQuery = `query { items (ids: [${user.businessMondayId.join(
            ","
          )}]) { id name } }`;
          const empresasRes = await fetch("/api/monday/item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: empresasQuery }),
          });
          const empresasData = await empresasRes.json();
          setEmpresas(empresasData?.data?.items || []);
        } else {
          setEmpresas([]);
        }
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    };
    // Solo cargar si no hay caché
    if (!profileCache.current) fetchProfile();
    else setProfile(profileCache.current);
  }, [session?.user?.email]);

  const handleChange = (title, value) => {
    setForm((f) => ({ ...f, [title]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      // Mapear a column_values para Monday
      const columnValues = {};
      columns.forEach((col) => {
        if (
          CAMPOS.map((c) => c.title).includes(col.title) &&
          col.title !== "Email"
        ) {
          if (col.type === "status" && col.settings_str) {
            columnValues[col.id] = { label: form[col.title] };
          } else if (col.type === "dropdown" && col.settings_str) {
            columnValues[col.id] = { labels: [form[col.title]] };
          } else if (col.type === "date") {
            columnValues[col.id] = { date: form[col.title] };
          } else {
            columnValues[col.id] = form[col.title];
          }
        }
      });
      const mutation = `mutation { change_multiple_column_values (item_id: ${
        profile.id
      }, board_id: ${profile.board.id}, column_values: ${JSON.stringify(
        JSON.stringify(columnValues)
      )}) { id } }`;
      await fetch("/api/monday/item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: mutation }),
      });
      setEditMode(false);
      // Refrescar perfil y empresas
      setLoading(true);
      const query = `query { items (ids: [${profile.id}]) { id name board { id } column_values { id text value column { id title type settings_str } } } }`;
      const mondayRes = await fetch("/api/monday/item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const mondayData = await mondayRes.json();
      const item = mondayData?.data?.items?.[0] || null;
      setProfile(item);
      setColumns(item?.column_values?.map((col) => col.column) || []);
      profileCache.current = null;
      setLoading(false);
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center text-[#233746] flex items-center justify-center gap-4">
        Perfil Personal
      </h1>
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-4 sm:p-8 md:p-12 mb-6 border border-gray-100">
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#233746]"></div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-4">
            {error}
          </div>
        )}
        {profile && (
          <form className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 w-full">
            {CAMPOS.map(({ title, icon }) => {
              if (title === "Email" || title === "Género") {
                if (title === "Género") {
                  const colGenero = columns.find((c) => c.title === "Género");
                  const colEmail = columns.find((c) => c.title === "Email");
                  return (
                    <div
                      key="genero-email"
                      className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 border-b py-4"
                    >
                      {/* Género */}
                      <div className="flex items-start gap-3">
                        {icon}
                        <div className="flex-1">
                          <div className="font-medium mb-2 text-gray-700">
                            {title}
                          </div>
                          <select
                            className="select select-bordered w-full bg-white"
                            value={form["Género"] || ""}
                            onChange={(e) =>
                              handleChange("Género", e.target.value)
                            }
                            disabled={!editMode}
                          >
                            <option value="">Selecciona una opción</option>
                            {colGenero &&
                              colGenero.settings_str &&
                              Object.values(
                                JSON.parse(colGenero.settings_str).labels || {}
                              ).map((label) => {
                                const labelStr =
                                  typeof label === "object"
                                    ? label.name
                                    : label;
                                return (
                                  <option key={labelStr} value={labelStr}>
                                    {labelStr}
                                  </option>
                                );
                              })}
                          </select>
                        </div>
                      </div>
                      {/* Email */}
                      <div className="flex items-start gap-3">
                        <FaEnvelope className="text-gray-600 mt-1" />
                        <div className="flex-1">
                          <div className="font-medium mb-2 text-gray-700">
                            Email
                          </div>
                          <div className="text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                            {form["Email"]}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }

              // Para Comunidad, siempre mostrar como select
              if (title === "Comunidad") {
                const colComunidad = columns.find(
                  (c) => c.title === "Comunidad"
                );
                return (
                  <div
                    key={title}
                    className="flex items-start gap-3 border-b py-4"
                  >
                    {icon}
                    <div className="flex-1">
                      <div className="font-medium mb-2 text-gray-700">
                        {title}
                      </div>
                      <select
                        className="select select-bordered w-full bg-white"
                        value={form[title] || ""}
                        onChange={(e) => handleChange(title, e.target.value)}
                        disabled={!editMode}
                      >
                        <option value="">Selecciona una opción</option>
                        {colComunidad &&
                          colComunidad.settings_str &&
                          Object.values(
                            JSON.parse(colComunidad.settings_str).labels || {}
                          ).map((label) => {
                            const labelStr =
                              typeof label === "object" ? label.name : label;
                            return (
                              <option key={labelStr} value={labelStr}>
                                {labelStr}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  </div>
                );
              }

              // Buscar columna para tipo
              const col = columns.find((c) => c.title === title);
              return (
                <div
                  key={title}
                  className="flex items-start gap-3 border-b py-4"
                >
                  {icon}
                  <div className="flex-1">
                    <div className="font-medium mb-2 text-gray-700">
                      {title}
                    </div>
                    {!editMode ? (
                      <div className="text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                        {form[title] || (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    ) : col?.type === "date" ? (
                      <input
                        type="date"
                        className="input input-bordered w-full bg-white"
                        value={form[title] || ""}
                        onChange={(e) => handleChange(title, e.target.value)}
                      />
                    ) : (
                      <input
                        type={title === "Teléfono" ? "tel" : "text"}
                        className="input input-bordered w-full bg-white"
                        value={form[title] || ""}
                        onChange={(e) => handleChange(title, e.target.value)}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Foto de perfil */}
            <div className="col-span-2 border-b py-4">
              <div className="flex flex-col items-center gap-4">
                <div className="font-medium text-gray-700">Foto de Perfil</div>
                <ImageUpload
                  initialUrl={
                    profile?.column_values?.find((c) =>
                      c.column?.title?.toLowerCase().includes("foto")
                    )?.text ||
                    form["Foto de Perfil"] ||
                    form["Foto"] ||
                    form["fotoPerfil"] ||
                    form["foto"] ||
                    ""
                  }
                  onUpload={async (url) => {
                    await fetch(`/api/user/profile`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: session.user.email,
                        fotoPerfil: url,
                      }),
                    });
                    profileCache.current = null;
                    window.location.reload();
                  }}
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="col-span-2 flex flex-col sm:flex-row gap-4 justify-end mt-6">
              {!editMode ? (
                <button
                  type="button"
                  className="btn btn-primary bg-[#233746] border-[#233746] hover:bg-[#f99d25] hover:border-[#f99d25] text-white w-full sm:w-auto"
                  onClick={() => setEditMode(true)}
                >
                  Editar Perfil
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-success bg-[#f99d25] border-[#f99d25] text-white w-full sm:w-auto"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost w-full sm:w-auto"
                    onClick={() => setEditMode(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </form>
        )}
        {!loading && !profile && !error && (
          <div className="text-center py-8 text-gray-500">
            No se encontró información de perfil.
          </div>
        )}
      </div>
    </div>
  );
}
