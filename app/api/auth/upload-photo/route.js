import { NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

export async function POST(request) {
  console.log("=== INICIO DE UPLOAD PHOTO ===");

  try {
    // Inicializar el cliente de Google Cloud Storage
    console.log("Inicializando Storage...");
    const storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS),
    });

    console.log("Obteniendo bucket...");
    const bucket = storage.bucket(
      process.env.GOOGLE_CLOUD_BUCKET_PROFILE_PHOTOS
    );

    console.log("Procesando formData...");
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      console.log("No se encontró archivo en la solicitud");
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen" },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "La imagen no debe superar los 5MB" },
        { status: 400 }
      );
    }

    console.log("Archivo recibido:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Convertir el archivo a buffer
    console.log("Convirtiendo archivo a buffer...");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generar nombre único para el archivo
    const sanitizedName = file.name.replace(/\s+/g, "-").toLowerCase();
    const fileName = `${Date.now()}-${sanitizedName}`;
    console.log("Nombre del archivo generado:", fileName);

    // Subir el archivo a Google Cloud Storage
    console.log("Iniciando subida a Google Cloud Storage...");
    const blob = bucket.file(fileName);

    try {
      console.log("Guardando archivo...");
      await blob.save(buffer, {
        metadata: {
          contentType: file.type,
        },
      });

      console.log("Archivo guardado exitosamente");
      const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      console.log("URL generada:", url);

      return NextResponse.json({
        success: true,
        url: url,
      });
    } catch (uploadError) {
      console.error("Error al subir archivo:", uploadError);
      return NextResponse.json(
        {
          error: "Error al subir el archivo",
          details: uploadError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error general en upload-photo:", error);
    return NextResponse.json(
      {
        error: "Error al procesar la solicitud",
        details: error.message,
      },
      { status: 500 }
    );
  } finally {
    console.log("=== FIN DE UPLOAD PHOTO ===");
  }
}
