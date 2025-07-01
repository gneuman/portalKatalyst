"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function UserProfileForm({
  email, // Puede venir del slug (update) o de la sesión (personal)
  mode = "update", // "update", "personal" o "registration"
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
        const res = await fetch(
          `/api/user/profile?email=${encodeURIComponent(email)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );
        const data = await res.json();
        console.log("[UserProfileForm] Respuesta de backend:", data);

        if (data && data.personalMondayId) {
          setPersonalMondayId(data.personalMondayId);
          console.log(
            "[UserProfileForm] MondayID seteado en estado:",
            data.personalMondayId
          );
        } else {
          // Si no hay MondayID, crearlo automáticamente con todos los datos del formulario
          console.warn(
            "[UserProfileForm] No se encontró personalMondayId, creando contacto en Monday con todos los datos del formulario..."
          );
          // Usar los datos actuales del formulario para crear el contacto
          const payload = {
            email,
            nombre: form.nombre || data?.firstName || data?.name || email,
            apellidoP: form.apellidoPaterno || data?.lastName || "",
            apellidoM: form.apellidoMaterno || data?.secondLastName || "",
            telefono: form.telefono || data?.phone || "",
            fechaNacimiento: form.fechaNacimiento || data?.dateOfBirth || "",
            genero: form.genero || data?.gender || "",
            comunidad: form.comunidad || data?.community || "",
            foto: form.fotoPerfil || data?.fotoPerfil || "",
          };
          const createRes = await fetch("/api/auth/create-monday-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const createData = await createRes.json();
          if (createData.mondayId) {
            setPersonalMondayId(createData.mondayId);
            console.log(
              "[UserProfileForm] MondayID creado y seteado:",
              createData.mondayId
            );
          } else {
            console.error(
              "[UserProfileForm] Error al crear contacto en Monday:",
              createData
            );
          }
        }

        // 1. Obtener estructura del board de Monday.com
        const schemaRes = await fetch("/api/monday/board/structure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ boardId: "9010881028" }), // Board de Contactos
        });
        const schemaData = await schemaRes.json();
        const board = schemaData?.data?.boards?.[0];
        let ids = {};
        if (board?.columns) {
          setColumns(board.columns);
          console.log(
            "[UserProfileForm] Todas las columnas del board:",
            board.columns
          );

          // Mapea los títulos a IDs
          board.columns.forEach((col) => {
            console.log(
              `[UserProfileForm] Procesando columna: ${col.title} (ID: ${col.id}, Tipo: ${col.type})`
            );
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

          console.log("[UserProfileForm] IDs mapeados:", ids);
        }

        if (data && data.columnValues) {
          // Si tenemos los valores de columna, mapearlos dinámicamente
          const cv = data.columnValues;
          console.log("[UserProfileForm] Column Values recibidos:", cv);
          console.log("[UserProfileForm] IDs mapeados:", ids);

          // Obtener la URL de la foto
          let fotoUrl = "";
          if (cv[ids.foto]) {
            fotoUrl = cv[ids.foto];
            console.log(
              "[UserProfileForm] Foto encontrada en Monday.com:",
              fotoUrl
            );
          } else if (data.fotoPerfil) {
            fotoUrl = data.fotoPerfil;
            console.log(
              "[UserProfileForm] Foto encontrada en MongoDB:",
              fotoUrl
            );
          }

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
            fotoPerfil: fotoUrl,
          });
          setPreviewUrl(fotoUrl || null);
          console.log("[UserProfileForm] Preview URL seteada:", fotoUrl);
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
          console.log(
            "[UserProfileForm] Preview URL seteada (fallback):",
            data.fotoPerfil
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
      // Asegurar que existe personalMondayId antes de continuar
      if (!personalMondayId) {
        console.log(
          "[UserProfileForm] No hay personalMondayId, creando contacto en Monday.com..."
        );
        const createResponse = await fetch("/api/auth/create-monday-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email }),
        });

        const createData = await createResponse.json();

        if (createResponse.ok && createData.mondayId) {
          setPersonalMondayId(createData.mondayId);
          console.log(
            "[UserProfileForm] Contacto creado con ID:",
            createData.mondayId
          );
        } else {
          throw new Error("No se pudo crear el contacto en Monday.com");
        }
      }

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

      // Construir column_values dinámicamente - CON FORMATO CORRECTO
      const column_values = {};
      const nombreCompleto =
        `${form.nombre} ${form.apellidoPaterno} ${form.apellidoMaterno}`.trim();

      console.log(
        "[UserProfileForm] Construyendo column_values para Monday.com (FORMATO CORRECTO)"
      );
      console.log("[UserProfileForm] Form data:", form);
      console.log("[UserProfileForm] Columns:", columns);
      console.log("[UserProfileForm] Nombre completo a usar:", nombreCompleto);

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

        // Campos de texto simple
        if (col.title === "Nombre" && form.nombre && form.nombre.trim()) {
          column_values[col.id] = form.nombre.trim();
          console.log(`[UserProfileForm] Agregando Nombre: ${form.nombre}`);
        }
        if (
          col.title === "Apellido Paterno" &&
          form.apellidoPaterno &&
          form.apellidoPaterno.trim()
        ) {
          column_values[col.id] = form.apellidoPaterno.trim();
          console.log(
            `[UserProfileForm] Agregando Apellido Paterno: ${form.apellidoPaterno}`
          );
        }
        if (
          col.title === "Apellido Materno" &&
          form.apellidoMaterno &&
          form.apellidoMaterno.trim()
        ) {
          column_values[col.id] = form.apellidoMaterno.trim();
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
        if (
          (col.title === "Foto Perfil" ||
            col.title === "Foto De Perfil" ||
            col.title === "Foto de perfil") &&
          fotoUrl &&
          fotoUrl.trim()
        ) {
          column_values[col.id] = fotoUrl.trim();
          console.log(`[UserProfileForm] Agregando Foto Perfil: ${fotoUrl}`);
        }

        // Campo de teléfono - formato correcto
        if (col.title === "Teléfono" && form.telefono && form.telefono.trim()) {
          column_values[col.id] = {
            phone: form.telefono.trim(),
            countryShortName: "MX",
          };
          console.log(`[UserProfileForm] Agregando Teléfono: ${form.telefono}`);
        }

        // Campo de fecha - formato correcto
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

        // Campo de dropdown - formato correcto con labels e ids
        if (
          col.title === "Género" &&
          col.type === "dropdown" &&
          form.genero &&
          form.genero.trim()
        ) {
          column_values[col.id] = {
            labels: [form.genero.trim()],
            ids: [1], // ID por defecto, ajustar según sea necesario
          };
          console.log(`[UserProfileForm] Agregando Género: ${form.genero}`);
        }

        // Campo de status - formato correcto con index
        if (
          col.title === "Comunidad" &&
          col.type === "status" &&
          form.comunidad &&
          form.comunidad.trim()
        ) {
          const labels = col.settings_str
            ? JSON.parse(col.settings_str).labels
            : {};
          const index = Object.entries(labels).find(
            ([, v]) =>
              (typeof v === "object" ? v.name : v) === form.comunidad.trim()
          )?.[0];
          if (index !== undefined) {
            column_values[col.id] = { index: parseInt(index) };
            console.log(
              `[UserProfileForm] Agregando Comunidad: ${form.comunidad} (index: ${index})`
            );
          }
        }
      });

      console.log("[UserProfileForm] Column_values final:", column_values);
      console.log(
        "[UserProfileForm] Columnas que se van a modificar en Monday.com:"
      );
      Object.entries(column_values).forEach(([colId, value]) => {
        const col = columns.find((c) => c.id === colId);
        console.log(
          `  - ${col?.title || "Columna desconocida"} (ID: ${colId}):`,
          value
        );
      });

      // Verificar que hay columnas para actualizar
      if (Object.keys(column_values).length === 0) {
        console.log(
          "[UserProfileForm] No hay columnas para actualizar en Monday.com"
        );
        // Continuar solo con la actualización de MongoDB
      } else {
        // Usar el MondayID ya cargado
        let board_id = process.env.NEXT_PUBLIC_MONDAY_BOARD_ID;
        console.log(
          "[UserProfileForm] MondayID usado para update:",
          personalMondayId
        );
        console.log("[UserProfileForm] board_id usado para update:", board_id);

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
              create_labels_if_missing: true
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

        // Actualizar el nombre del item en Monday.com
        const nombreCompleto =
          `${form.nombre} ${form.apellidoPaterno} ${form.apellidoMaterno}`.trim();
        if (nombreCompleto && nombreCompleto !== form.email) {
          console.log(
            "[UserProfileForm] Actualizando nombre del item a:",
            nombreCompleto
          );

          const updateNameMutation = {
            query: `mutation { 
              change_simple_column_value (
                board_id: ${board_id}, 
                item_id: ${personalMondayId}, 
                column_id: "name", 
                value: "${nombreCompleto}"
              ) { 
                id 
              } 
            }`,
          };

          const nameRes = await fetch("/api/monday/item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateNameMutation),
          });

          const nameData = await nameRes.json();
          console.log(
            "[UserProfileForm] Respuesta de actualización de nombre:",
            nameData
          );

          if (!nameRes.ok || nameData.errors) {
            console.warn(
              "Error al actualizar nombre del item:",
              nameData.errors
            );
          } else {
            console.log(
              "[UserProfileForm] Nombre del item actualizado exitosamente"
            );
          }
        }
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
        // Para personal, recargar la página completa para actualizar toda la UI
        toast.success("Perfil actualizado correctamente");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else if (mode === "registration") {
        // Para registration, llamar callback para enviar correo de verificación
        if (onSuccess) {
          onSuccess();
        } else {
          toast.success("Perfil completado correctamente");
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

      console.log(
        "[UserProfileForm] Valor de personalMondayId al hacer submit:",
        personalMondayId
      );
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!email) return <div>Falta el email</div>;
  if (loading) return <div>Cargando...</div>;

  // Encontrar columnas para comunidad y género
  const colComunidad = columns.find((c) => c.title === "Comunidad");
  const colGenero = columns.find((c) => c.title === "Género");

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === "personal"
                ? "Mi Perfil Personal"
                : mode === "registration"
                ? "Completa tu perfil"
                : "Actualiza tus datos"}
            </h2>
            {personalMondayId && (
              <div className="text-xs text-gray-400 mb-2">
                <span className="font-mono">
                  Katalyst ID: {personalMondayId}
                </span>
              </div>
            )}
            <p className="text-sm text-gray-600">
              {mode === "personal"
                ? "Gestiona tu información personal"
                : mode === "registration"
                ? "Completa tu información personal para continuar"
                : "Por favor, revisa y actualiza tu información"}
            </p>
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
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
                  <div className="relative w-full h-full">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="rounded-full object-cover"
                      onError={(e) => {
                        console.error(
                          "[UserProfileForm] Error cargando imagen:",
                          previewUrl
                        );
                        // Ocultar la imagen y mostrar placeholder
                        e.target.style.display = "none";
                        const parent = e.target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                              <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                              </svg>
                            </div>
                          `;
                        }
                      }}
                      onLoad={() => {
                        console.log(
                          "[UserProfileForm] Imagen cargada exitosamente:",
                          previewUrl
                        );
                      }}
                      unoptimized={true} // Evitar optimización de Next.js para URLs externas
                    />
                  </div>
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
    </div>
  );
}
