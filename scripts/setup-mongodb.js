const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

async function setupMongoDB() {
  console.log("🔧 Configuración de MongoDB para Portal Katalyst");
  console.log("===============================================\n");

  // Verificar si existe .env.local
  const envPath = path.join(process.cwd(), ".env.local");
  const envExists = fs.existsSync(envPath);

  if (!envExists) {
    console.log("📝 Creando archivo .env.local...");

    const envContent = `# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portalKatalyst?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Resend Email Configuration
RESEND_API_KEY=your-resend-api-key
RESEND_AUDIENCE_ID=your-audience-id

# Monday.com Configuration
MONDAY_API_TOKEN=your-monday-api-token

# Stripe Configuration
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
`;

    fs.writeFileSync(envPath, envContent);
    console.log("✅ Archivo .env.local creado");
    console.log(
      "⚠️  IMPORTANTE: Edita el archivo .env.local y configura tu MONGODB_URI real"
    );
    console.log("   Luego ejecuta: node scripts/fix-collections.js\n");
    return;
  }

  // Leer .env.local
  const envContent = fs.readFileSync(envPath, "utf8");
  const mongoUriMatch = envContent.match(/MONGODB_URI=(.+)/);

  if (!mongoUriMatch || mongoUriMatch[1].includes("username:password")) {
    console.log(
      "⚠️  MONGODB_URI no está configurado correctamente en .env.local"
    );
    console.log(
      "📝 Por favor edita el archivo .env.local y configura tu MONGODB_URI real"
    );
    console.log(
      "   Ejemplo: MONGODB_URI=mongodb+srv://tuusuario:tucontraseña@cluster.mongodb.net/portalKatalyst"
    );
    return;
  }

  const uri = mongoUriMatch[1];
  const client = new MongoClient(uri);

  try {
    console.log("🔌 Conectando a MongoDB...");
    await client.connect();
    console.log("✅ Conectado a MongoDB exitosamente");

    const db = client.db();

    // Listar todas las colecciones
    const collections = await db.listCollections().toArray();
    console.log(
      "\n📋 Colecciones existentes:",
      collections.map((c) => c.name)
    );

    // Verificar si existen las colecciones incorrectas
    const hasIncorrectVerificationTokens = collections.some(
      (c) => c.name === "verificationtokens"
    );
    const hasCorrectVerificationTokens = collections.some(
      (c) => c.name === "verification_tokens"
    );
    const hasUsers = collections.some((c) => c.name === "users");

    console.log("\n🔍 Análisis de colecciones:");
    console.log(
      `   verificationtokens (incorrecta): ${
        hasIncorrectVerificationTokens ? "❌ Existe" : "✅ No existe"
      }`
    );
    console.log(
      `   verification_tokens (correcta): ${
        hasCorrectVerificationTokens ? "✅ Existe" : "❌ No existe"
      }`
    );
    console.log(`   users: ${hasUsers ? "✅ Existe" : "❌ No existe"}`);

    if (hasIncorrectVerificationTokens) {
      console.log("\n🔄 Migrando verificationtokens a verification_tokens...");

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

    // Crear colecciones si no existen
    if (!hasCorrectVerificationTokens) {
      console.log("\n📝 Creando colección verification_tokens...");
      await db.createCollection("verification_tokens");
      console.log("✅ Colección verification_tokens creada");
    }

    if (!hasUsers) {
      console.log("\n📝 Creando colección users...");
      await db.createCollection("users");
      console.log("✅ Colección users creada");
    }

    // Listar colecciones finales
    const finalCollections = await db.listCollections().toArray();
    console.log(
      "\n📋 Colecciones finales:",
      finalCollections.map((c) => c.name)
    );

    console.log("\n🎉 Proceso completado exitosamente");
    console.log(
      "🚀 Ahora puedes probar el sistema de registro en: http://localhost:3000/test-registration"
    );
  } catch (error) {
    console.error("\n❌ Error:", error.message);

    if (error.message.includes("ECONNREFUSED")) {
      console.log("\n💡 Soluciones posibles:");
      console.log("   1. Verifica que tu MONGODB_URI sea correcto");
      console.log(
        "   2. Si usas MongoDB Atlas, verifica tu IP en la whitelist"
      );
      console.log(
        "   3. Si usas MongoDB local, asegúrate de que esté ejecutándose"
      );
    }
  } finally {
    await client.close();
    console.log("\n🔌 Conexión cerrada");
  }
}

// Ejecutar el script
setupMongoDB();
