const { MongoClient } = require("mongodb");

async function verifyUserComplete() {
  const uri =
    "mongodb+srv://gneuman:PrFXwRrt1783GeFr@katalyst.dsegh0e.mongodb.net/?retryWrites=true&w=majority&appName=katalyst";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Conectado a MongoDB");

    const db = client.db();

    // Buscar el usuario
    const user = await db.collection("users").findOne({
      email: "neumang+nocode@gmail.com",
    });

    if (!user) {
      console.log("❌ Usuario no encontrado en MongoDB");
      return;
    }

    console.log("✅ Usuario encontrado en MongoDB");
    console.log("📊 Estado del usuario:");
    console.log("  - Email:", user.email);
    console.log("  - Name:", user.name);
    console.log("  - First Name:", user.firstName);
    console.log("  - Last Name:", user.lastName);
    console.log("  - Monday ID:", user.personalMondayId);
    console.log("  - Email Verified:", user.emailVerified);
    console.log("  - Image:", user.image);
    console.log("  - Created At:", user.createdAt);
    console.log("  - Updated At:", user.updatedAt);

    // Verificar campos críticos
    const criticalFields = {
      email: !!user.email,
      personalMondayId: !!user.personalMondayId,
      emailVerified: !!user.emailVerified,
      name: !!(user.name || user.firstName),
    };

    console.log("\n🔍 Verificación de campos críticos:");
    Object.entries(criticalFields).forEach(([field, hasValue]) => {
      console.log(`  - ${field}: ${hasValue ? "✅" : "❌"}`);
    });

    const allCriticalFieldsPresent =
      Object.values(criticalFields).every(Boolean);

    if (allCriticalFieldsPresent) {
      console.log("\n🎉 Usuario completamente configurado y listo para usar");
    } else {
      console.log("\n⚠️ Usuario incompleto, faltan campos críticos");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

verifyUserComplete();
