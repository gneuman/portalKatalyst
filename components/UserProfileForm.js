"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function UserProfileForm({
  email, // Puede venir del slug (update) o de la sesión (personal)
  mode = "update", // "update" o "personal"
  onSuccess = null, // Callback opcional para personal
}) {
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
  const [personalMondayId, setPersonalMondayId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!email) return;

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
        }

        // 2. Obtener datos del usuario
        const res = await fetch(`/api/user/profile?email=${email}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        console.log("[UserProfileForm] Respuesta de backend:", data);

        if (data && data.columnValues) {
          // Si tenemos los valores de columna, mapearlos dinámicamente
          const cv = data.columnValues;
          console.log("[UserProfileForm] Column Values recibidos:", cv);
          console.log("[UserProfileForm] IDs mapeados:", ids);

          setForm({
            email: data.email,
            nombre: cv[ids.nombre] || data.firstName || "",
            apellidoPaterno: cv[ids.apellidoP] || data.lastName || "",
            apellidoMaterno: cv[ids.apellidoM] || data.secondLastName || "",
            telefono:
              cv[ids.telefono]?.phone || cv[ids.telefono] || data.phone || "",
            fechaNacimiento: cv[ids.fechaNacimiento] || data.dateOfBirth || "",
            genero: cv[ids.genero] || data.gender || "",
            comunidad:
              cv[ids.comunidad] || cv[ids.status] || data.community || "",
            fotoPerfil: cv[ids.foto] || data.fotoPerfil || "",
          });
          setPreviewUrl(cv[ids.foto] || data.fotoPerfil || null);
        } else if (data) {
          // Fallback si no hay columnValues
          setForm({
            email: data.email,
            nombre: data.firstName || "",
            apellidoPaterno: data.lastName || "",
            apellidoMaterno: data.secondLastName || "",
            telefono: data.phone || "",
            fechaNacimiento: data.dateOfBirth || "",
            genero: data.gender || "",
            comunidad: data.community || "",
            fotoPerfil: data.fotoPerfil || "",
          });
          setPreviewUrl(data.fotoPerfil || null);
        }

        if (data && data.personalMondayId) {
          setPersonalMondayId(data.personalMondayId);
          console.log(
            "[UserProfileForm] MondayID seteado en estado:",
            data.personalMondayId
          );
        } else {
          console.warn(
            "[UserProfileForm] No se encontró personalMondayId en la respuesta:",
            data
          );
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
      const nombreCompleto =
        `${form.nombre} ${form.apellidoPaterno} ${form.apellidoMaterno}`.trim();

      console.log(
        "[UserProfileForm] Construyendo column_values para Monday.com"
      );
      console.log("[UserProfileForm] Form data:", form);
      console.log("[UserProfileForm] Columns:", columns);

      columns.forEach((col) => {
        // Saltar columnas que no se pueden actualizar (auto calculated)
        if (
          col.type === "formula" ||
          col.type === "auto_number" ||
          col.type === "world_clock"
        ) {
          console.log(
            `[UserProfileForm] Saltando columna ${col.title} (tipo: ${col.type})`
          );
          return;
        }

        console.log(
          `[UserProfileForm] Procesando columna: ${col.title} (ID: ${col.id}, Tipo: ${col.type})`
        );

        if (col.title === "Nombre" && form.nombre) {
          column_values[col.id] = form.nombre;
          console.log(`[UserProfileForm] Agregando Nombre: ${form.nombre}`);
        }
        if (col.title === "Apellido Paterno" && form.apellidoPaterno) {
          column_values[col.id] = form.apellidoPaterno;
          console.log(
            `[UserProfileForm] Agregando Apellido Paterno: ${form.apellidoPaterno}`
          );
        }
        if (col.title === "Apellido Materno" && form.apellidoMaterno) {
          column_values[col.id] = form.apellidoMaterno;
          console.log(
            `[UserProfileForm] Agregando Apellido Materno: ${form.apellidoMaterno}`
          );
        }
        if (col.title === "Nombre Completo" && nombreCompleto) {
          column_values[col.id] = nombreCompleto;
          console.log(
            `[UserProfileForm] Agregando Nombre Completo: ${nombreCompleto}`
          );
        }
        if (col.title === "Email" && form.email) {
          column_values[col.id] = form.email;
          console.log(`[UserProfileForm] Agregando Email: ${form.email}`);
        }
        if (col.title === "Teléfono" && form.telefono) {
          column_values[col.id] = {
            phone: form.telefono,
            countryShortName: "MX",
          };
          console.log(`[UserProfileForm] Agregando Teléfono: ${form.telefono}`);
        }
        if (
          (col.title === "Fecha Nacimiento" ||
            col.title === "Fecha de Nacimiento") &&
          form.fechaNacimiento
        ) {
          column_values[col.id] = { date: form.fechaNacimiento };
          console.log(
            `[UserProfileForm] Agregando Fecha Nacimiento: ${form.fechaNacimiento}`
          );
        }
        if (col.title === "Género" && col.type === "dropdown" && form.genero) {
          column_values[col.id] = { labels: [form.genero] };
          console.log(`[UserProfileForm] Agregando Género: ${form.genero}`);
        }
        if (
          col.title === "Comunidad" &&
          col.type === "status" &&
          form.comunidad
        ) {
          const labels = col.settings_str
            ? JSON.parse(col.settings_str).labels
            : {};
          const index = Object.entries(labels).find(
            ([, v]) => (typeof v === "object" ? v.name : v) === form.comunidad
          )?.[0];
          if (index !== undefined) {
            column_values[col.id] = { index: parseInt(index) };
            console.log(
              `[UserProfileForm] Agregando Comunidad: ${form.comunidad} (index: ${index})`
            );
          }
        }
        if (
          (col.title === "Foto Perfil" ||
            col.title === "Foto De Perfil" ||
            col.title === "Foto de perfil") &&
          fotoUrl
        ) {
          column_values[col.id] = fotoUrl;
          console.log(`[UserProfileForm] Agregando Foto Perfil: ${fotoUrl}`);
        }
      });

      console.log("[UserProfileForm] Column_values final:", column_values);

      // Usar el MondayID ya cargado
      let board_id = process.env.NEXT_PUBLIC_MONDAY_BOARD_ID;
      console.log(
        "[UserProfileForm] MondayID usado para update:",
        personalMondayId
      );
      console.log("[UserProfileForm] board_id usado para update:", board_id);
      console.log(
        "[UserProfileForm] column_values enviados a Monday:",
        column_values
      );

      if (!personalMondayId || !board_id)
        throw new Error("No se encontró el ID de Monday.com para actualizar");

      // Mutation a Monday.com
      const mutation = {
        query: `mutation { 
          change_multiple_column_values (
            board_id: ${board_id}, 
            item_id: ${personalMondayId}, 
            column_values: "${JSON.stringify(column_values).replace(
              /"/g,
              '\\"'
            )}",
            create_labels_if_missing: false
          ) { 
            id 
          } 
        }`,
      };

      console.log("[UserProfileForm] Mutation a enviar:", mutation.query);

      const mondayRes = await fetch("/api/monday/item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mutation),
      });
      const mondayData = await mondayRes.json();
      console.log("[UserProfileForm] Respuesta de Monday.com:", mondayData);
      if (!mondayRes.ok || mondayData.errors) {
        throw new Error(
          "Error al actualizar datos en Monday.com: " +
            (mondayData.errors?.[0]?.message || "")
        );
      }

      // Actualizar MongoDB
      const userData = {
        email: form.email,
        name: nombreCompleto,
        firstName: form.nombre,
        lastName: form.apellidoPaterno,
        secondLastName: form.apellidoMaterno,
        phone: form.telefono,
        dateOfBirth: form.fechaNacimiento,
        gender: form.genero,
        community: form.comunidad,
        fotoPerfil: fotoUrl,
        personalMondayId: personalMondayId,
        isVerified: false,
      };

      console.log("[UserProfileForm] Datos enviados a MongoDB:", userData);
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      console.log("[UserProfileForm] Respuesta de MongoDB:", data);
      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar usuario en MongoDB");
      }

      // Manejar éxito según el modo
      if (mode === "personal") {
        // Para personal, llamar callback si existe
        if (onSuccess) {
          onSuccess();
        } else {
          toast.success("Perfil actualizado correctamente");
        }
      } else {
        // Para update, enviar correo mágico y redirigir
        const result = await signIn("email", {
          email: form.email,
          redirect: false,
          callbackUrl: "/dashboard",
        });
        if (result?.error) {
          throw new Error("Hubo un error al enviar el correo de verificación.");
        }
        toast.success(
          "Datos actualizados correctamente. Por favor, verifica tu correo electrónico."
        );
        router.push(
          `/api/auth/verify-request?email=${encodeURIComponent(form.email)}`
        );
      }
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
            {mode === "personal" ? "Mi Perfil Personal" : "Actualiza tus datos"}
          </h2>
          {personalMondayId && (
            <div className="text-center text-xs text-gray-400 mt-1">
              <span className="font-mono">MondayID: {personalMondayId}</span>
            </div>
          )}
          <p className="mt-2 text-center text-sm text-gray-600">
            {mode === "personal"
              ? "Gestiona tu información personal"
              : "Por favor, revisa y actualiza tu información"}
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

          <div className="flex flex-col items-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto de perfil
            </label>
            <div className="relative w-32 h-32 mb-4">
              {previewUrl && previewUrl !== "" ? (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Apellido Paterno
              </label>
              <input
                type="text"
                value={form.apellidoPaterno}
                onChange={(e) =>
                  handleChange("apellidoPaterno", e.target.value)
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Apellido Materno
              </label>
              <input
                type="text"
                value={form.apellidoMaterno}
                onChange={(e) =>
                  handleChange("apellidoMaterno", e.target.value)
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={form.fechaNacimiento}
                onChange={(e) =>
                  handleChange("fechaNacimiento", e.target.value)
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Género
              </label>
              <select
                value={form.genero}
                onChange={(e) => handleChange("genero", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Selecciona una opción</option>
                {colGenero &&
                  colGenero.settings_str &&
                  Object.values(
                    JSON.parse(colGenero.settings_str).labels || {}
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

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Comunidad
              </label>
              <select
                value={form.comunidad}
                onChange={(e) => handleChange("comunidad", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded p-3">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
