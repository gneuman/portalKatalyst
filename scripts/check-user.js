const { MongoClient } = require("mongodb");

async function checkUser() {
  const uri =
    "mongodb+srv://gneuman:PrFXwRrt1783GeFr@katalyst.dsegh0e.mongodb.net/?retryWrites=true&w=majority&appName=katalyst";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Conectado a MongoDB");

    const db = client.db();

    // Buscar el usuario directamente
    const user = await db.collection("users").findOne({
      email: "neumang+nocode@gmail.com",
    });

    if (user) {
      console.log("✅ Usuario encontrado en MongoDB:");
      console.log("ID:", user._id);
      console.log("Email:", user.email);
      console.log("Validado:", user.validado);
      console.log("EmailVerified:", user.emailVerified);
      console.log("Colección:", "users");
    } else {
      console.log("❌ Usuario no encontrado en MongoDB");

      // Listar todas las colecciones
      const collections = await db.listCollections().toArray();
      console.log(
        "📋 Colecciones disponibles:",
        collections.map((c) => c.name)
      );

      // Buscar en todas las colecciones
      for (const collection of collections) {
        const userInCollection = await db.collection(collection.name).findOne({
          email: "neumang+nocode@gmail.com",
        });
        if (userInCollection) {
          console.log(`✅ Usuario encontrado en colección: ${collection.name}`);
          console.log("ID:", userInCollection._id);
          console.log("Email:", userInCollection.email);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

checkUser();
