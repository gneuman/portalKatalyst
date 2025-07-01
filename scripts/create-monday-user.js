const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const MONDAY_API_URL = "https://api.monday.com/v2";

async function mondayQuery(query) {
  try {
    const res = await fetch(MONDAY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.MONDAY_API_KEY,
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error en Monday API:", error);
    throw error;
  }
}

async function createMondayUser() {
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

    // Crear el usuario en Monday.com
    const boardId = process.env.MONDAY_BOARD_ID || "9010881028";

    const createUserQuery = `
      mutation {
        create_item (
          board_id: ${boardId},
          item_name: "${user.name || user.firstName || "Usuario Nuevo"}",
          column_values: "{\\"email_mkqcc0tb\\": \\"${
            user.email
          }\\", \\"text_mkqc3cea\\": \\"${
      user.firstName || ""
    }\\", \\"text_mkqcmqh0\\": \\"${
      user.lastName || ""
    }\\", \\"phone_mkqcqejx\\": \\"${user.phone || ""}\\"}"
        ) {
          id
          name
        }
      }
    `;

    console.log("📝 Creando usuario en Monday.com...");
    console.log("Query:", createUserQuery);

    // Hacer la llamada real a Monday.com
    const mondayResponse = await mondayQuery(createUserQuery);
    console.log(
      "📡 Respuesta de Monday.com:",
      JSON.stringify(mondayResponse, null, 2)
    );

    if (mondayResponse.data && mondayResponse.data.create_item) {
      const mondayId = mondayResponse.data.create_item.id;
      console.log("✅ Usuario creado en Monday.com con ID:", mondayId);

      // Actualizar el usuario en MongoDB con el Monday ID
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
    } else {
      console.log("❌ Error al crear usuario en Monday.com:", mondayResponse);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

createMondayUser();
