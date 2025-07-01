const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function checkUser() {
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
