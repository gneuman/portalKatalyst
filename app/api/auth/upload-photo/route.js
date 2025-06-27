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

    // Verificar variables de entorno
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_PROFILE_PHOTOS;
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);

    if (!bucketName) {
      throw new Error(
        "GOOGLE_CLOUD_BUCKET_PROFILE_PHOTOS no está definida en las variables de entorno"
      );
    }
    if (!credentials) {
      throw new Error(
        "GOOGLE_CLOUD_CREDENTIALS no está definida o es inválida"
      );
    }

    // NOTA: Necesitas un access_token válido. Si tus credenciales son de tipo service_account, deberás generar el token OAuth2 antes de usar este método en producción.
    // Aquí asumimos que tienes un access_token válido en las credenciales.
    const accessToken = credentials.access_token || credentials.token;
    if (!accessToken) {
      throw new Error(
        "No se encontró access_token en las credenciales. Debes generar un access_token válido para Google Cloud Storage."
      );
    }

    // Subida directa usando fetch
    const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?name=${fileName}&uploadType=media`;
    console.log("Subiendo archivo usando fetch directo a:", uploadUrl);

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
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

    const url = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    console.log("URL generada:", url);

    return NextResponse.json({
      success: true,
      url: url,
    });
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
