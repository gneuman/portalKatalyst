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
    console.log("=== VERIFICACIÓN DE VARIABLES DE ENTORNO ===");
    console.log(
      "GOOGLE_CLOUD_BUCKET_PROFILE_PHOTOS:",
      process.env.GOOGLE_CLOUD_BUCKET_PROFILE_PHOTOS
        ? "✅ Definida"
        : "❌ No definida"
    );
    console.log(
      "GOOGLE_CLOUD_PROJECT_ID:",
      process.env.GOOGLE_CLOUD_PROJECT_ID ? "✅ Definida" : "❌ No definida"
    );
    console.log(
      "GOOGLE_CLOUD_CREDENTIALS:",
      process.env.GOOGLE_CLOUD_CREDENTIALS ? "✅ Definida" : "❌ No definida"
    );

    if (!process.env.GOOGLE_CLOUD_BUCKET_PROFILE_PHOTOS) {
      throw new Error(
        "GOOGLE_CLOUD_BUCKET_PROFILE_PHOTOS no está definida en las variables de entorno"
      );
    }

    if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
      throw new Error(
        "GOOGLE_CLOUD_PROJECT_ID no está definida en las variables de entorno"
      );
    }

    if (!process.env.GOOGLE_CLOUD_CREDENTIALS) {
      throw new Error(
        "GOOGLE_CLOUD_CREDENTIALS no está definida en las variables de entorno"
      );
    }

    // Verificar formato de credenciales
    console.log("=== VERIFICACIÓN DE CREDENCIALES ===");
    let credentials;
    try {
      credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
      console.log("✅ Credenciales parseadas correctamente");
      console.log("Tipo de credencial:", credentials.type);
      console.log("Project ID en credenciales:", credentials.project_id);
      console.log("Client email:", credentials.client_email);
      console.log(
        "¿Tiene private_key?:",
        credentials.private_key ? "✅ Sí" : "❌ No"
      );
    } catch (parseError) {
      console.error("❌ Error al parsear credenciales:", parseError.message);
      throw new Error(
        "Las credenciales de Google Cloud no tienen un formato JSON válido"
      );
    }

    // Usar la librería oficial de Google Cloud Storage
    console.log("=== INICIANDO GOOGLE CLOUD STORAGE ===");
    console.log("Iniciando subida con Google Cloud Storage...");

    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_PROFILE_PHOTOS;

    try {
      console.log("Importando librería de Google Cloud Storage...");
      const { Storage } = await import("@google-cloud/storage");

      console.log("Creando instancia de Storage...");
      const storage = new Storage({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials: credentials,
      });

      console.log("✅ Instancia de Storage creada exitosamente");
      console.log("Verificando bucket:", bucketName);

      console.log("Creando bucket y blob...");
      const bucket = storage.bucket(bucketName);

      // Verificar si el bucket existe
      const [exists] = await bucket.exists();
      if (!exists) {
        throw new Error(
          `El bucket '${bucketName}' no existe o no tienes permisos para acceder a él`
        );
      }
      console.log("✅ Bucket existe y es accesible");

      const blob = bucket.file(fileName);
      console.log("✅ Blob creado:", fileName);

      console.log("Subiendo archivo...");
      await blob.save(buffer, {
        metadata: {
          contentType: file.type,
        },
        resumable: false,
      });
      console.log("✅ Archivo subido exitosamente");

      // Hacer el archivo público
      console.log("Haciendo archivo público...");
      await blob.makePublic();
      console.log("✅ Archivo hecho público");

      const url = `https://storage.googleapis.com/${bucketName}/${fileName}`;
      console.log("URL generada:", url);

      return NextResponse.json({
        success: true,
        url: url,
      });
    } catch (uploadError) {
      console.error("=== ERROR DETALLADO DE UPLOAD ===");
      console.error("Tipo de error:", uploadError.constructor.name);
      console.error("Mensaje de error:", uploadError.message);
      console.error("Stack trace:", uploadError.stack);

      // Verificar si es un error de autenticación
      if (
        uploadError.message.includes("401") ||
        uploadError.message.includes("Unauthorized")
      ) {
        console.error(
          "❌ ERROR DE AUTENTICACIÓN: Las credenciales no son válidas o han expirado"
        );
        console.error(
          "Verifica que las credenciales de servicio tengan los permisos correctos"
        );
      }

      if (
        uploadError.message.includes("403") ||
        uploadError.message.includes("Forbidden")
      ) {
        console.error(
          "❌ ERROR DE PERMISOS: No tienes permisos para acceder al bucket o subir archivos"
        );
        console.error(
          "Verifica que la cuenta de servicio tenga el rol 'Storage Object Admin'"
        );
      }

      if (
        uploadError.message.includes("404") ||
        uploadError.message.includes("Not Found")
      ) {
        console.error(
          "❌ ERROR DE BUCKET: El bucket no existe o no es accesible"
        );
      }

      return NextResponse.json(
        {
          error: "Error al subir el archivo",
          details: uploadError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("=== ERROR GENERAL ===");
    console.error("Tipo de error:", error.constructor.name);
    console.error("Mensaje de error:", error.message);
    console.error("Stack trace:", error.stack);

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
