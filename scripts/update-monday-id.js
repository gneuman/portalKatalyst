const { MongoClient } = require("mongodb");

async function updateMondayId() {
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
