"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "react-hot-toast";
import ImageUpload from "@/components/ImageUpload";
import { FaCamera } from "react-icons/fa";
import Image from "next/image";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    email: email || "",
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    telefono: "",
    fechaNacimiento: "",
    genero: "",
    comunidad: "",
    pais: "MX",
  });
  const [columns, setColumns] = useState([]);
  const [colIds, setColIds] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fotoUrl, setFotoUrl] = useState(null);
  const [showFullForm, setShowFullForm] = useState(false);

  useEffect(() => {
    console.log("=== INICIO DEL PROCESO DE REGISTRO ===");
    console.log("Email recibido:", email);

    if (!email) {
      console.log("No se encontró email, redirigiendo a signin");
      router.push("/api/auth/signin");
      return;
    }

    // Primero verificar si el usuario existe
    const checkUser = async () => {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.needsValidation && data.userData) {
            // Si encontramos datos en Monday.com, rellenar el formulario
            const userData = data.userData;
            setForm((prev) => ({
              ...prev,
              nombre: userData.firstName || "",
              apellidoPaterno: userData.lastName || "",
              apellidoMaterno: userData.secondLastName || "",
              telefono: userData.phone || "",
              fechaNacimiento: userData.dateOfBirth || "",
              genero: userData.gender || "",
              comunidad: userData.comunity || "",
            }));
            if (userData.fotoPerfil) {
              setPreviewUrl(userData.fotoPerfil);
              setFotoUrl(userData.fotoPerfil);
            }
            setShowFullForm(true);
            toast.success(
              "Se encontraron datos existentes. Por favor, valida y completa la información."
            );
          } else if (data.redirect) {
            // Si el usuario existe en MongoDB, redirigir a verificación
            window.location.href = data.redirect;
            return;
          } else {
            // Si no se encontró el usuario, mostrar formulario vacío
            setShowFullForm(true);
          }
        } else {
          throw new Error(data.error || "Error al verificar usuario");
        }
      } catch (error) {
        console.error("Error al verificar usuario:", error);
        toast.error(error.message);
      }
    };

    checkUser();

    // Obtener estructura del board de Monday.com
    const fetchBoardSchema = async () => {
      const res = await fetch("/api/monday/board/structure", {
        method: "POST",
      });
      const data = await res.json();
      const board = data?.data?.boards?.[0];
      if (board?.columns) {
        setColumns(board.columns);
        // Mapea los títulos a IDs
        const ids = {};
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
    };
    fetchBoardSchema();
  }, [email, router]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      nombreCompleto:
        `${prev.nombre} ${prev.apellidoPaterno} ${prev.apellidoMaterno}`.trim(),
    }));
  }, [form.nombre, form.apellidoPaterno, form.apellidoMaterno]);

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
    console.clear();
    console.log("=== INICIO REGISTRO ===");
    try {
      // Mostrar el contenido del formulario antes de cualquier procesamiento
      console.log("==== FORMULARIO ANTES DE SUBIR FOTO ====");
      console.log(JSON.stringify(form, null, 2));

      // 1. Subir foto a Google Storage si existe
      let fotoUrl = null;
      if (form.foto) {
        const photoFormData = new FormData();
        photoFormData.append("file", form.foto);
        const photoResponse = await fetch("/api/auth/upload-photo", {
          method: "POST",
          body: photoFormData,
        });
        const photoData = await photoResponse.json();
        if (!photoResponse.ok) {
          console.error("Error subida foto:", photoData);
          throw new Error(photoData.error || "Error al subir la foto");
        }
        fotoUrl = photoData.url;
        toast.success("Foto subida exitosamente");
        console.log("Foto subida:", fotoUrl);
      }

      // 2. Enviar datos al endpoint de registro
      const userData = {
        name: form.nombreCompleto,
        firstName: form.nombre,
        lastName: form.apellidoPaterno,
        secondLastName: form.apellidoMaterno,
        email: form.email,
        phone: form.telefono,
        dateOfBirth: form.fechaNacimiento,
        gender: form.genero,
        community: form.comunidad,
        fotoPerfil: fotoUrl,
      };

      console.log("Datos a enviar:", JSON.stringify(userData, null, 2));

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al registrar usuario");
      }

      if (data.redirect) {
        // Si la actualización fue exitosa, redirigir a verificación
        window.location.href = data.redirect;
        return;
      }

      toast.success(data.message || "Usuario registrado exitosamente");
      setShowFullForm(false);
    } catch (error) {
      console.error("Error en el registro:", error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
      console.log("=== FIN REGISTRO ===");
    }
  };

  // Encontrar columnas para comunidad y género
  const colComunidad = columns.find((c) => c.title === "Comunidad");
  const colGenero = columns.find((c) => c.title === "Género");

  if (!showFullForm) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Completa tu registro
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Por favor, proporciona la siguiente información para continuar
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Email en una fila completa */}
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

          {/* Foto de perfil */}
          <div className="flex flex-col items-center">
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
          </div>

          {/* Grid 2x2 para los campos principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>

          {/* Nombre completo solo lectura */}
          <div className="w-full">
            <label
              htmlFor="nombreCompleto"
              className="block text-sm font-medium text-gray-700"
            >
              Nombre completo (Item Name)
            </label>
            <input
              id="nombreCompleto"
              name="nombreCompleto"
              type="text"
              value={form.nombreCompleto || ""}
              disabled
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
            />
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
              {loading ? "Registrando..." : "Completar Registro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
