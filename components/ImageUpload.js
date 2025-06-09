import { useRef, useState } from "react";

export default function ImageUpload({ onUpload, initialUrl }) {
  const [preview, setPreview] = useState(initialUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef();

  const handleFileChange = async (e) => {
    setError("");
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar los 5MB");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/auth/upload-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        onUpload(data.url);
      } else {
        setError(data.error || "Error al subir la imagen");
      }
    } catch (e) {
      setError("Error al subir la imagen");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-2">
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-gray-400">Sin foto</span>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        className="px-4 py-1 bg-[#54B8B4] text-white rounded text-xs font-semibold"
        onClick={() => inputRef.current.click()}
        disabled={loading}
      >
        {loading ? "Subiendo..." : "Cambiar foto"}
      </button>
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
}
