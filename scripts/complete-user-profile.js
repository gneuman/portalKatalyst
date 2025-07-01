const { MongoClient } = require("mongodb");

async function completeUserProfile() {
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

    console.log("✅ Usuario encontrado en MongoDB:", user.email);

    // Completar el perfil del usuario
    await db.collection("users").updateOne(
      { email: "neumang+nocode@gmail.com" },
      {
        $set: {
          name: "Usuario NoCode",
          firstName: "Usuario",
          lastName: "NoCode",
          image:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
          updatedAt: new Date(),
        },
      }
    );

    console.log("✅ Perfil del usuario completado");

    // Verificar el usuario actualizado
    const updatedUser = await db.collection("users").findOne({
      email: "neumang+nocode@gmail.com",
    });

    console.log("📊 Usuario actualizado:");
    console.log("  - Email:", updatedUser.email);
    console.log("  - Name:", updatedUser.name);
    console.log("  - First Name:", updatedUser.firstName);
    console.log("  - Last Name:", updatedUser.lastName);
    console.log("  - Monday ID:", updatedUser.personalMondayId);
    console.log("  - Email Verified:", updatedUser.emailVerified);
    console.log("  - Image:", updatedUser.image);

    console.log("\n🎉 Usuario completamente configurado y listo para usar");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

completeUserProfile();
