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
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-center text-[#233746] flex items-center justify-center gap-4">
        Perfil Personal
      </h1>
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg p-12 mb-6 border border-gray-100">
        {loading && <p className="text-center">Cargando...</p>}
        {error && <p className="text-red-600 text-center">{error}</p>}
        {profile && (
          <form className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
            {CAMPOS.map(({ title, icon }) => {
              if (title === "Email" || title === "Género") {
                // Mostrar Género y Email juntos en la misma fila
                if (title === "Género") {
                  const colGenero = columns.find((c) => c.title === "Género");
                  const colEmail = columns.find((c) => c.title === "Email");
                  return (
                    <div
                      key="genero-email"
                      className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 border-b py-2 items-center"
                    >
                      {/* Género */}
                      <div className="flex items-center gap-3">
                        {icon}
                        <div className="flex-1">
                          <div className="font-medium mb-1">Género</div>
                          {!editMode ? (
                            <div className="text-gray-700">
                              {form["Género"] || (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          ) : colGenero?.type === "status" &&
                            colGenero?.settings_str ? (
                            <select
                              className="input input-bordered w-full"
                              value={form["Género"] || ""}
                              onChange={(e) =>
                                handleChange("Género", e.target.value)
                              }
                            >
                              <option value="">Selecciona una opción</option>
                              {Object.values(
                                JSON.parse(colGenero.settings_str).labels || {}
                              ).map((label) => (
                                <option key={label} value={label}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              className="input input-bordered w-full"
                              value={form["Género"] || ""}
                              onChange={(e) =>
                                handleChange("Género", e.target.value)
                              }
                            />
                          )}
                        </div>
                      </div>
                      {/* Email */}
                      <div className="flex items-center gap-3">
                        <FaEnvelope className="text-gray-600" />
                        <div className="flex-1">
                          <div className="font-medium mb-1">Email</div>
                          <div className="text-gray-500">{form["Email"]}</div>
                        </div>
                      </div>
                    </div>
                  );
                }
                // No renderizar Email por separado
                return null;
              }
              // Para Comunidad, forzar select en edición:
              if (title === "Comunidad") {
                const col = columns.find((c) => c.title === title);
                return (
                  <div
                    key={title}
                    className="flex items-center gap-3 border-b py-2"
                  >
                    {icon}
                    <div className="flex-1">
                      <div className="font-medium mb-1">{title}</div>
                      {!editMode ? (
                        <div className="text-gray-700">
                          {form[title] || (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      ) : col?.type === "dropdown" && col?.settings_str ? (
                        <select
                          className="input input-bordered w-full"
                          value={form[title] || ""}
                          onChange={(e) => handleChange(title, e.target.value)}
                        >
                          <option value="">Selecciona una opción</option>
                          {Object.values(
                            JSON.parse(col.settings_str).labels || {}
                          ).map((label) => (
                            <option key={label} value={label}>
                              {label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={form[title] || ""}
                          onChange={(e) => handleChange(title, e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                );
              }
              // Buscar columna para tipo
              const col = columns.find((c) => c.title === title);
              return (
                <div
                  key={title}
                  className="flex items-center gap-3 border-b py-2"
                >
                  {icon}
                  <div className="flex-1">
                    <div className="font-medium mb-1">{title}</div>
                    {!editMode ? (
                      <div className="text-gray-700">
                        {form[title] || (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    ) : col?.type === "date" ? (
                      <input
                        type="date"
                        className="input input-bordered w-full"
                        value={form[title] || ""}
                        onChange={(e) => handleChange(title, e.target.value)}
                      />
                    ) : col?.type === "status" && col?.settings_str ? (
                      <select
                        className="input input-bordered w-full"
                        value={form[title] || ""}
                        onChange={(e) => handleChange(title, e.target.value)}
                      >
                        <option value="">Selecciona una opción</option>
                        {Object.values(
                          JSON.parse(col.settings_str).labels || {}
                        ).map((label) => (
                          <option key={label} value={label}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={title === "Teléfono" ? "tel" : "text"}
                        className="input input-bordered w-full"
                        value={form[title] || ""}
                        onChange={(e) => handleChange(title, e.target.value)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            <div className="col-span-2 flex gap-2 mt-6 justify-end">
              {!editMode ? (
                <button
                  type="button"
                  className="btn btn-primary bg-[#233746] border-[#233746] hover:bg-[#f99d25] hover:border-[#f99d25] text-white"
                  onClick={() => setEditMode(true)}
                >
                  Editar
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-success bg-[#f99d25] border-[#f99d25] text-white"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
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
        {/* Resumen de empresas asociadas */}
        {!loading && empresas && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-2 text-[#233746]">
              <FaBuilding className="text-yellow-600" />
              <span className="font-bold">Empresas asociadas:</span>
            </div>
            {empresas.length > 0 ? (
              <ul className="list-disc ml-6">
                {empresas.map((e) => (
                  <li key={e.id} className="mb-1">
                    <span className="font-medium">{e.name}</span>{" "}
                    <span className="text-xs text-gray-400">(ID: {e.id})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 mb-2">
                No tienes empresas asociadas.
              </div>
            )}
            <div className="mt-4">
              <Link href="/dashboard/empresas">
                <button className="btn btn-secondary bg-[#f99d25] border-[#f99d25] text-white">
                  {empresas.length > 0 ? "Ir a Empresas" : "Agregar Empresa"}
                </button>
              </Link>
            </div>
          </div>
        )}
        {!loading && !profile && !error && (
          <p className="text-center">No se encontró información de perfil.</p>
        )}
      </div>
    </div>
  );
}
