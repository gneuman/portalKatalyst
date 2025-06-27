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
          setForm({
            email: data.email,
            nombre: cv[ids.nombre] || data.firstName || "",
            apellidoPaterno: cv[ids.apellidoP] || data.lastName || "",
            apellidoMaterno: cv[ids.apellidoM] || data.secondLastName || "",
            telefono: cv[ids.telefono] || data.phone || "",
            fechaNacimiento: cv[ids.fechaNacimiento] || data.dateOfBirth || "",
            genero: cv[ids.genero] || data.gender || "",
            comunidad: cv[ids.status] || data.community || "",
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

      columns.forEach((col) => {
        // Saltar columnas que no se pueden actualizar (auto calculated)
        if (
          col.type === "formula" ||
          col.type === "auto_number" ||
          col.type === "world_clock"
        ) {
          return;
        }

        if (col.title === "Nombre") column_values[col.id] = form.nombre;
        if (col.title === "Apellido Paterno")
          column_values[col.id] = form.apellidoPaterno;
        if (col.title === "Apellido Materno")
          column_values[col.id] = form.apellidoMaterno;
        if (col.title === "Nombre Completo")
          column_values[col.id] = nombreCompleto;
        if (col.title === "Email") column_values[col.id] = form.email;
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
          const labels = col.settings_str
            ? JSON.parse(col.settings_str).labels
            : {};
          const index = Object.entries(labels).find(
            ([, v]) => (typeof v === "object" ? v.name : v) === form.comunidad
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === "personal" ? "Mi Perfil Personal" : "Actualiza tus datos"}
          </h2>
          {personalMondayId && (
            <div className="text-xs text-gray-500 mt-1">
              <span className="font-mono">MondayID: {personalMondayId}</span>
            </div>
          )}
          <p className="text-sm text-gray-600 mt-1">
            {mode === "personal"
              ? "Gestiona tu información personal"
              : "Por favor, revisa y actualiza tu información"}
          </p>
        </div>

        {/* Form Content */}
        <form className="p-6 space-y-6" onSubmit={handleSubmit}>
          {/* Email Section */}
          <div className="w-full">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
            />
          </div>

          {/* Photo Section */}
          <div className="flex flex-col items-center space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Foto de perfil
            </label>
            <div className="relative w-32 h-32">
              {previewUrl && previewUrl !== "" ? (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                  <svg
                    className="w-12 h-12 text-gray-400"
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
            <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Seleccionar foto
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Personal Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellido Paterno
              </label>
              <input
                type="text"
                value={form.apellidoPaterno}
                onChange={(e) =>
                  handleChange("apellidoPaterno", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Tu apellido paterno"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellido Materno
              </label>
              <input
                type="text"
                value={form.apellidoMaterno}
                onChange={(e) =>
                  handleChange("apellidoMaterno", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Tu apellido materno"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Tu número de teléfono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={form.fechaNacimiento}
                onChange={(e) =>
                  handleChange("fechaNacimiento", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Género
              </label>
              <select
                value={form.genero}
                onChange={(e) => handleChange("genero", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Seleccionar género</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="No binario">No binario</option>
                <option value="Prefiero no decir">Prefiero no decir</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comunidad
              </label>
              <select
                value={form.comunidad}
                onChange={(e) => handleChange("comunidad", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Seleccionar comunidad</option>
                {colComunidad?.settings_str &&
                  JSON.parse(colComunidad.settings_str).labels &&
                  Object.entries(
                    JSON.parse(colComunidad.settings_str).labels
                  ).map(([key, value]) => (
                    <option
                      key={key}
                      value={typeof value === "object" ? value.name : value}
                    >
                      {typeof value === "object" ? value.name : value}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  Actualizando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
