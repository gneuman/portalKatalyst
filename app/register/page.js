"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaCamera } from "react-icons/fa";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { signIn } from "next-auth/react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const paises = [
    { nombre: "México", codigo: "MX", prefijo: "+52" },
    { nombre: "Israel", codigo: "IL", prefijo: "+972" },
    { nombre: "Estados Unidos", codigo: "US", prefijo: "+1" },
  ];

  const [form, setForm] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    telefono: "",
    fechaNacimiento: "",
    comunidad: "",
    genero: "",
    email: email || "",
    foto: null,
    nombreCompleto: "",
    pais: "MX",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [columns, setColumns] = useState([]);
  const [colIds, setColIds] = useState({});
  const [showFullForm, setShowFullForm] = useState(false);
  const [fotoUrl, setFotoUrl] = useState(null);

  useEffect(() => {
    console.log("=== INICIO DEL PROCESO DE REGISTRO ===");
    console.log("Email recibido:", email);

    if (!email) {
      console.log("No se encontró email, redirigiendo a signin");
      router.push("/api/auth/signin");
    }

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
    if (!email) {
      window.location.href = "/register";
    }
  }, [email]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      nombreCompleto:
        `${prev.nombre} ${prev.apellidoPaterno} ${prev.apellidoMaterno}`.trim(),
    }));
  }, [form.nombre, form.apellidoPaterno, form.apellidoMaterno]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      email: email || "",
    }));
  }, [email]);

  const handleChange = (field, value) => {
    console.log(`Actualizando campo ${field}:`, value);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        setError("Por favor selecciona una imagen válida");
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("La imagen no debe superar los 5MB");
        return;
      }

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
    setError(null);

    try {
      // 1. Verificar si el usuario existe
      const checkResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });

      const checkResult = await checkResponse.json();

      if (!checkResponse.ok) {
        if (checkResponse.status === 404) {
          // Si no existe en Monday, mostrar formulario completo
          setShowFullForm(true);
          return;
        }
        throw new Error(checkResult.error || "Error al verificar el usuario");
      }

      // Si existe en MongoDB o Monday, redirigir a verificación
      if (checkResult.redirect) {
        window.location.href = checkResult.redirect;
        return;
      }

      // Si llegamos aquí, es un nuevo usuario en Monday
      if (checkResult.mondayData) {
        // Pre-llenar el formulario con los datos de Monday
        setForm((prev) => ({
          ...prev,
          ...checkResult.mondayData,
        }));
        setShowFullForm(true);
        return;
      }
    } catch (error) {
      console.error("Error en el registro:", error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Encontrar columnas para comunidad y género
  const colComunidad = columns.find((c) => c.title === "Comunidad");
  const colGenero = columns.find((c) => c.title === "Género");

  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-[#233746]">
          Registro
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input input-bordered w-full"
              required
              disabled={loading}
            />
          </div>

          {showFullForm && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) =>
                      setForm({ ...form, nombre: e.target.value })
                    }
                    className="input input-bordered w-full"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido Paterno
                  </label>
                  <input
                    type="text"
                    value={form.apellidoPaterno}
                    onChange={(e) =>
                      setForm({ ...form, apellidoPaterno: e.target.value })
                    }
                    className="input input-bordered w-full"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido Materno
                </label>
                <input
                  type="text"
                  value={form.apellidoMaterno}
                  onChange={(e) =>
                    setForm({ ...form, apellidoMaterno: e.target.value })
                  }
                  className="input input-bordered w-full"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) =>
                    setForm({ ...form, telefono: e.target.value })
                  }
                  className="input input-bordered w-full"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={(e) =>
                    setForm({ ...form, fechaNacimiento: e.target.value })
                  }
                  className="input input-bordered w-full"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Género
                </label>
                <select
                  value={form.genero}
                  onChange={(e) => setForm({ ...form, genero: e.target.value })}
                  className="select select-bordered w-full"
                  required
                  disabled={loading}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comunidad
                </label>
                <select
                  value={form.comunidad}
                  onChange={(e) =>
                    setForm({ ...form, comunidad: e.target.value })
                  }
                  className="select select-bordered w-full"
                  required
                  disabled={loading}
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

              <div className="flex flex-col items-center gap-4">
                <label className="block text-sm font-medium text-gray-700">
                  Foto de Perfil
                </label>
                <ImageUpload
                  initialUrl={fotoUrl}
                  onUpload={setFotoUrl}
                  disabled={loading}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary bg-[#233746] border-[#233746] hover:bg-[#f99d25] hover:border-[#f99d25] text-white w-full"
            disabled={loading}
          >
            {loading
              ? "Procesando..."
              : showFullForm
              ? "Registrar"
              : "Continuar"}
          </button>
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
