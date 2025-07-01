const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function createMondayUserViaAPI() {
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

    console.log("✅ Usuario encontrado:", user.email);
    console.log("📊 Datos del usuario:", {
      name: user.name || "Sin nombre",
      firstName: user.firstName || "Sin nombre",
      lastName: user.lastName || "Sin apellido",
      email: user.email,
      phone: user.phone || "Sin teléfono",
    });

    // Preparar los datos para el endpoint con todos los campos requeridos
    const userData = {
      name: user.name || user.firstName || "Usuario Nuevo",
      nombre: user.firstName || user.name || "Usuario",
      apellidoP: user.lastName || "Apellido",
      apellidoM: "Materno",
      fechaNacimiento: "1990-01-01", // Fecha por defecto
      comunidad: "Katalyst",
      genero: "No especificado",
      email: user.email,
      telefono: user.phone || "555-123-4567",
      pais: "MX",
      foto: user.image || "",
    };

    console.log("📝 Enviando datos al endpoint de creación de usuario...");
    console.log("Datos:", userData);

    // Llamar al endpoint de creación de usuario en Monday.com
    const response = await fetch(
      "http://localhost:3000/api/auth/create-monday-user",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      }
    );

    const result = await response.json();
    console.log("📡 Respuesta del endpoint:", JSON.stringify(result, null, 2));

    if (result.success && result.mondayId) {
      console.log("✅ Usuario creado en Monday.com con ID:", result.mondayId);

      // Actualizar el usuario en MongoDB con el Monday ID
      await db.collection("users").updateOne(
        { email: "neumang+nocode@gmail.com" },
        {
          $set: {
            personalMondayId: result.mondayId,
            updatedAt: new Date(),
          },
        }
      );

      console.log(
        "✅ Usuario actualizado en MongoDB con Monday ID:",
        result.mondayId
      );
      console.log("🎉 Proceso completado exitosamente");
    } else {
      console.log("❌ Error al crear usuario en Monday.com:", result.error);
      if (result.missingFields) {
        console.log("❌ Campos faltantes:", result.missingFields);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

createMondayUserViaAPI();
