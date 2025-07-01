const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function fixCollections() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ Error: MONGODB_URI no está configurado");
    console.log("📝 Por favor crea un archivo .env.local con:");
    console.log(
      "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portalKatalyst"
    );
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Conectado a MongoDB");

    const db = client.db();

    // Listar todas las colecciones
    const collections = await db.listCollections().toArray();
    console.log(
      "📋 Colecciones existentes:",
      collections.map((c) => c.name)
    );

    // Verificar si existen las colecciones incorrectas
    const hasIncorrectVerificationTokens = collections.some(
      (c) => c.name === "verificationtokens"
    );
    const hasIncorrectUsers = collections.some(
      (c) => c.name === "users" && c.name !== "users"
    );

    if (hasIncorrectVerificationTokens) {
      console.log("🔄 Migrando verificationtokens a verification_tokens...");

      // Obtener datos de la colección incorrecta
      const incorrectTokens = await db
        .collection("verificationtokens")
        .find({})
        .toArray();
      console.log(
        `📊 Encontrados ${incorrectTokens.length} tokens para migrar`
      );

      if (incorrectTokens.length > 0) {
        // Insertar en la colección correcta
        await db.collection("verification_tokens").insertMany(incorrectTokens);
        console.log("✅ Tokens migrados a verification_tokens");

        // Eliminar la colección incorrecta
        await db.collection("verificationtokens").drop();
        console.log("🗑️ Colección verificationtokens eliminada");
      }
    }

    // Verificar si la colección correcta existe
    const hasCorrectVerificationTokens = collections.some(
      (c) => c.name === "verification_tokens"
    );
    if (!hasCorrectVerificationTokens) {
      console.log("📝 Creando colección verification_tokens...");
      await db.createCollection("verification_tokens");
      console.log("✅ Colección verification_tokens creada");
    }

    // Verificar si la colección users existe
    const hasUsers = collections.some((c) => c.name === "users");
    if (!hasUsers) {
      console.log("📝 Creando colección users...");
      await db.createCollection("users");
      console.log("✅ Colección users creada");
    }

    // Listar colecciones finales
    const finalCollections = await db.listCollections().toArray();
    console.log(
      "📋 Colecciones finales:",
      finalCollections.map((c) => c.name)
    );

    console.log("🎉 Proceso completado exitosamente");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("🔌 Conexión cerrada");
  }
}

// Ejecutar el script
fixCollections();
