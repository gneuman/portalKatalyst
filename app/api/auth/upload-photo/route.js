import { NextResponse } from "next/server";

export async function POST(request) {
  console.log("=== INICIO DE UPLOAD PHOTO ===");

  try {
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

    // Usar fetch directo a la API de Google Cloud Storage para evitar problemas con la librería
    console.log("Iniciando subida directa a Google Cloud Storage...");

    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_PROFILE_PHOTOS;
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);

    // Crear URL de upload directo
    const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?name=${fileName}&uploadType=media`;

    try {
      console.log("Subiendo archivo usando fetch directo...");

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${
            credentials.access_token || credentials.token
          }`,
          "Content-Type": file.type,
          "Content-Length": buffer.length.toString(),
        },
        body: buffer,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error en respuesta de Google Storage:", errorText);
        throw new Error(
          `Error de Google Storage: ${response.status} ${errorText}`
        );
      }

      const result = await response.json();
      console.log("Respuesta de Google Storage:", result);

      const url = `https://storage.googleapis.com/${bucketName}/${fileName}`;
      console.log("URL generada:", url);

      return NextResponse.json({
        success: true,
        url: url,
      });
    } catch (uploadError) {
      console.error("Error al subir archivo:", uploadError);

      // Si falla el método directo, intentar con la librería como fallback
      try {
        console.log("Intentando con librería como fallback...");
        const { Storage } = await import("@google-cloud/storage");

        const storage = new Storage({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          credentials: credentials,
        });

        const bucket = storage.bucket(bucketName);
        const blob = bucket.file(fileName);

        await blob.save(buffer, {
          metadata: {
            contentType: file.type,
          },
          resumable: false,
        });

        const url = `https://storage.googleapis.com/${bucketName}/${fileName}`;
        console.log("Archivo guardado exitosamente con librería");

        return NextResponse.json({
          success: true,
          url: url,
        });
      } catch (libError) {
        console.error("Error con librería también:", libError);
        return NextResponse.json(
          {
            error: "Error al subir el archivo",
            details: uploadError.message,
          },
          { status: 500 }
        );
      }
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
