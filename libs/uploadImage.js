/**
 * Función utilitaria para subir imágenes a Google Cloud Storage
 * Basada en la lógica probada de update/page.js
 */
export async function uploadImage(file) {
  if (!file) {
    throw new Error("No se proporcionó ningún archivo");
  }

  // Validar tipo de archivo
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen");
  }

  // Validar tamaño (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("La imagen no debe superar los 5MB");
  }

  try {
    const photoFormData = new FormData();
    photoFormData.append("file", file);

    const photoResponse = await fetch("/api/auth/upload-photo", {
      method: "POST",
      body: photoFormData,
    });

    const photoData = await photoResponse.json();

    if (!photoResponse.ok) {
      throw new Error(photoData.error || "Error al subir la foto");
    }

    return photoData.url;
  } catch (error) {
    console.error("Error al subir imagen:", error);
    throw error;
  }
}
