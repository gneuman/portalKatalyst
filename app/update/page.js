"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { FaCamera } from "react-icons/fa";

function UpdateUser() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: email || "",
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    telefono: "",
    fechaNacimiento: "",
    genero: "",
    comunidad: "",
    fotoPerfil: "",
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [columns, setColumns] = useState([]);
  const [colIds, setColIds] = useState({});

  useEffect(() => {
    if (!email) return;
    // Obtener datos del usuario desde el backend
    const fetchUser = async () => {
      setLoading(true);
      try {
        // 1. Obtener estructura del board de Monday.com
        const schemaRes = await fetch("/api/monday/board/structure", {
          method: "POST",
        });
        const schemaData = await schemaRes.json();
        const board = schemaData?.data?.boards?.[0];
        let ids = {};
        if (board?.columns) {
          setColumns(board.columns);
          // Mapea los títulos a IDs
          board.columns.forEach((col) => {
            if (col.title === "Nombre") ids.nombre = col.id;
            if (col.title === "Apellido Paterno") ids.apellidoP = col.id;
            if (col.title === "Apellido Materno") ids.apellidoM = col.id;
            if (
              col.title === "Fecha Nacimiento" ||
              col.title === "Fecha de Nacimiento"
            )
              ids.fechaNacimiento = col.id;
            if (col.title === "Género") ids.genero = col.id;
            if (col.title === "Comunidad") ids.comunidad = col.id;
            if (col.title === "Teléfono") ids.telefono = col.id;
            if (col.title === "Email") ids.email = col.id;
            if (col.title === "Foto Perfil" || col.title === "Foto de perfil")
              ids.foto = col.id;
            if (col.type === "color") ids.status = col.id;
          });
          setColIds(ids);
        }
        // 2. Obtener datos del usuario
        const res = await fetch(`/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (data.userData && data.userData.columnValues) {
          // Si tenemos los valores de columna, mapearlos dinámicamente
          const cv = data.userData.columnValues;
          setForm({
            email: data.userData.email,
            nombre: cv[ids.nombre] || "",
            apellidoPaterno: cv[ids.apellidoP] || "",
            apellidoMaterno: cv[ids.apellidoM] || "",
            telefono: cv[ids.telefono] || "",
            fechaNacimiento: cv[ids.fechaNacimiento] || "",
            genero: cv[ids.genero] || "",
            comunidad: cv[ids.status] || data.userData.community || "",
            fotoPerfil: cv[ids.foto] || "",
          });
          setPreviewUrl(cv[ids.foto] || null);
        } else if (data.userData) {
          // Fallback si no hay columnValues
          setForm({
            email: data.userData.email,
            nombre: data.userData.firstName || "",
            apellidoPaterno: data.userData.lastName || "",
            apellidoMaterno: data.userData.secondLastName || "",
            telefono: data.userData.phone || "",
            fechaNacimiento: data.userData.dateOfBirth || "",
            genero: data.userData.gender || "",
            comunidad: data.userData.community || "",
            fotoPerfil: data.userData.fotoPerfil || "",
          });
          setPreviewUrl(data.userData.fotoPerfil || null);
        }
      } catch (err) {
        toast.error("Error al obtener datos del usuario o estructura");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [email]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, foto: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      let fotoUrl = form.fotoPerfil;
      if (form.foto) {
        const photoFormData = new FormData();
        photoFormData.append("file", form.foto);
        const photoResponse = await fetch("/api/auth/upload-photo", {
          method: "POST",
          body: photoFormData,
        });
        const photoData = await photoResponse.json();
        if (!photoResponse.ok) {
          throw new Error(photoData.error || "Error al subir la foto");
        }
        fotoUrl = photoData.url;
      }

      // Construir column_values dinámicamente
      const column_values = {};
      columns.forEach((col) => {
        if (col.title === "Nombre") column_values[col.id] = form.nombre;
        if (col.title === "Apellido Paterno")
          column_values[col.id] = form.apellidoPaterno;
        if (col.title === "Apellido Materno")
          column_values[col.id] = form.apellidoMaterno;
        if (col.title === "Teléfono")
          column_values[col.id] = {
            phone: form.telefono,
            countryShortName: "MX",
          };
        if (
          col.title === "Fecha Nacimiento" ||
          col.title === "Fecha de Nacimiento"
        )
          column_values[col.id] = { date: form.fechaNacimiento };
        if (col.title === "Género" && col.type === "dropdown")
          column_values[col.id] = { labels: [form.genero] };
        if (col.title === "Comunidad" && col.type === "status") {
          // Buscar el índice del label
          const labels = col.settings_str
            ? JSON.parse(col.settings_str).labels
            : {};
          const index = Object.entries(labels).find(
            ([i, v]) => (typeof v === "object" ? v.name : v) === form.comunidad
          )?.[0];
          if (index !== undefined)
            column_values[col.id] = { index: parseInt(index) };
        }
        if (
          (col.title === "Foto Perfil" ||
            col.title === "Foto De Perfil" ||
            col.title === "Foto de perfil") &&
          fotoUrl
        )
          column_values[col.id] = fotoUrl;
      });

      // Obtener el boardId y itemId (personalMondayId)
      const boardId =
        columns[0]?.board_id || process.env.NEXT_PUBLIC_MONDAY_BOARD_ID;
      const itemId = searchParams.get("itemId") || null; // O pásalo desde el backend si lo tienes
      // Si no tienes el itemId, puedes obtenerlo de userData.personalMondayId V2
      // Aquí asumimos que el backend lo envía en userData.personalMondayId
      const resUser = await fetch(`/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const dataUser = await resUser.json();
      const personalMondayId = dataUser.userData?.personalMondayId;
      const board_id = boardId || dataUser.userData?.boardId;
      if (!personalMondayId || !board_id)
        throw new Error("No se encontró el ID de Monday.com para actualizar");

      // Mutation a Monday.com
      const mutation = {
        query: `mutation { change_multiple_column_values (board_id: ${board_id}, item_id: ${personalMondayId}, column_values: "${JSON.stringify(
          column_values
        ).replace(/"/g, '"')}", create_labels_if_missing: false) { id } }`,
      };
      const mondayRes = await fetch("/api/monday/item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mutation),
      });
      const mondayData = await mondayRes.json();
      if (!mondayRes.ok || mondayData.errors) {
        throw new Error(
          "Error al actualizar datos en Monday.com: " +
            (mondayData.errors?.[0]?.message || "")
        );
      }

      // Actualizar MongoDB
      const userData = {
        email: form.email,
        firstName: form.nombre,
        lastName: form.apellidoPaterno,
        secondLastName: form.apellidoMaterno,
        phone: form.telefono,
        dateOfBirth: form.fechaNacimiento,
        gender: form.genero,
        community: form.comunidad,
        fotoPerfil: fotoUrl,
      };
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar usuario en MongoDB");
      }
      toast.success("Datos actualizados correctamente");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Encontrar columnas para comunidad y género
  const colComunidad = columns.find((c) => c.title === "Comunidad");
  const colGenero = columns.find((c) => c.title === "Género");

  if (!email) return <div>Falta el email</div>;
  if (loading) return <div>Cargando...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Actualiza tus datos
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Por favor, revisa y actualiza tu información
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="w-full">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              disabled
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
            />
          </div>
          <div className="relative w-32 h-32 mb-4">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                <FaCamera className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          <label className="cursor-pointer bg-white px-4 py-2 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300">
            <span>Seleccionar foto</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="nombre"
                className="block text-sm font-medium text-gray-700"
              >
                Nombre
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                value={form.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="apellidoPaterno"
                className="block text-sm font-medium text-gray-700"
              >
                Apellido Paterno
              </label>
              <input
                id="apellidoPaterno"
                name="apellidoPaterno"
                type="text"
                required
                value={form.apellidoPaterno}
                onChange={(e) =>
                  handleChange("apellidoPaterno", e.target.value)
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="apellidoMaterno"
                className="block text-sm font-medium text-gray-700"
              >
                Apellido Materno
              </label>
              <input
                id="apellidoMaterno"
                name="apellidoMaterno"
                type="text"
                required
                value={form.apellidoMaterno}
                onChange={(e) =>
                  handleChange("apellidoMaterno", e.target.value)
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="telefono"
                className="block text-sm font-medium text-gray-700"
              >
                Teléfono
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                required
                value={form.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="fechaNacimiento"
                className="block text-sm font-medium text-gray-700"
              >
                Fecha de Nacimiento
              </label>
              <input
                id="fechaNacimiento"
                name="fechaNacimiento"
                type="date"
                required
                value={form.fechaNacimiento}
                onChange={(e) =>
                  handleChange("fechaNacimiento", e.target.value)
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="comunidad"
                className="block text-sm font-medium text-gray-700"
              >
                Comunidad
              </label>
              <select
                id="comunidad"
                name="comunidad"
                required
                value={form.comunidad}
                onChange={(e) => handleChange("comunidad", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecciona una opción</option>
                {(() => {
                  const options =
                    colComunidad && colComunidad.settings_str
                      ? Object.values(
                          JSON.parse(colComunidad.settings_str).labels || {}
                        )
                      : [];
                  const labelList = options.map((label) =>
                    typeof label === "object" ? label.name : label
                  );
                  const needsExtra =
                    form.comunidad && !labelList.includes(form.comunidad);
                  return (
                    <>
                      {options.map((label) => {
                        const labelStr =
                          typeof label === "object" ? label.name : label;
                        return (
                          <option key={labelStr} value={labelStr}>
                            {labelStr}
                          </option>
                        );
                      })}
                      {needsExtra && (
                        <option key={form.comunidad} value={form.comunidad}>
                          {form.comunidad} (valor antiguo)
                        </option>
                      )}
                    </>
                  );
                })()}
              </select>
            </div>
            <div>
              <label
                htmlFor="genero"
                className="block text-sm font-medium text-gray-700"
              >
                Género
              </label>
              <select
                id="genero"
                name="genero"
                required
                value={form.genero}
                onChange={(e) => handleChange("genero", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecciona una opción</option>
                {(() => {
                  const options =
                    colGenero && colGenero.settings_str
                      ? Object.values(
                          JSON.parse(colGenero.settings_str).labels || {}
                        )
                      : [];
                  const labelList = options.map((label) =>
                    typeof label === "object" ? label.name : label
                  );
                  const needsExtra =
                    form.genero && !labelList.includes(form.genero);
                  return (
                    <>
                      {options.map((label) => {
                        const labelStr =
                          typeof label === "object" ? label.name : label;
                        return (
                          <option key={labelStr} value={labelStr}>
                            {labelStr}
                          </option>
                        );
                      })}
                      {needsExtra && (
                        <option key={form.genero} value={form.genero}>
                          {form.genero} (valor antiguo)
                        </option>
                      )}
                    </>
                  );
                })()}
              </select>
            </div>
          </div>
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Actualizando..." : "Actualizar datos"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <UpdateUser />
    </Suspense>
  );
}
