const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function updateMondayId() {
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

    // Buscar el usuario
    const user = await db.collection("users").findOne({
      email: "neumang+nocode@gmail.com",
    });

    if (!user) {
      console.log("❌ Usuario no encontrado en MongoDB");
      return;
    }

    console.log("✅ Usuario encontrado en MongoDB:", user.email);
    console.log("📊 Monday ID actual:", user.personalMondayId || "No tiene");

    // Actualizar con el Monday ID que ya sabemos
    const mondayId = "9487967116";

    await db.collection("users").updateOne(
      { email: "neumang+nocode@gmail.com" },
      {
        $set: {
          personalMondayId: mondayId,
          updatedAt: new Date(),
        },
      }
    );

    console.log("✅ Usuario actualizado en MongoDB con Monday ID:", mondayId);
    console.log("🎉 Proceso completado exitosamente");

    // Verificar que se actualizó correctamente
    const updatedUser = await db.collection("users").findOne({
      email: "neumang+nocode@gmail.com",
    });

    console.log("📊 Usuario actualizado:", {
      email: updatedUser.email,
      personalMondayId: updatedUser.personalMondayId,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

updateMondayId();
