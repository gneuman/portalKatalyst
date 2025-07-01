const { MongoClient } = require("mongodb");

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

async function checkMondayUser() {
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

    // Buscar el usuario en Monday.com por correo
    const boardId = process.env.MONDAY_CONTACTS_BOARD_ID || "9010881028";

    const checkQuery = `query {
      items_by_column_values (board_id: ${boardId}, column_id: "email", column_value: "${user.email}") {
        id
        name
        column_values {
          id
          text
          value
          type
        }
      }
    }`;

    console.log("🔍 Buscando usuario en Monday.com por correo...");
    console.log("Query:", checkQuery);

    const mondayResponse = await mondayQuery(checkQuery);
    console.log(
      "📡 Respuesta de Monday.com:",
      JSON.stringify(mondayResponse, null, 2)
    );

    const existingUser = mondayResponse?.data?.items_by_column_values?.[0];

    if (existingUser) {
      console.log(
        "✅ Usuario encontrado en Monday.com con ID:",
        existingUser.id
      );

      // Actualizar el usuario en MongoDB con el Monday ID correcto
      await db.collection("users").updateOne(
        { email: "neumang+nocode@gmail.com" },
        {
          $set: {
            personalMondayId: existingUser.id,
            updatedAt: new Date(),
          },
        }
      );

      console.log(
        "✅ Usuario actualizado en MongoDB con Monday ID:",
        existingUser.id
      );
      console.log("🎉 Proceso completado exitosamente");
    } else {
      console.log("❌ Usuario no encontrado en Monday.com por correo");

      // Verificar si existe con el ID que mencionaste
      const checkByIdQuery = `query {
        items(ids: [9487967116]) {
          id
          name
          column_values {
            id
            text
            value
            type
          }
        }
      }`;

      console.log("🔍 Verificando usuario con ID específico...");
      const byIdResponse = await mondayQuery(checkByIdQuery);
      console.log(
        "📡 Respuesta por ID:",
        JSON.stringify(byIdResponse, null, 2)
      );

      if (byIdResponse?.data?.items?.[0]) {
        const item = byIdResponse.data.items[0];
        console.log("✅ Usuario encontrado con ID 9487967116:", item.name);

        // Buscar el email en las columnas
        const emailColumn = item.column_values.find(
          (col) => col.type === "email"
        );
        if (emailColumn) {
          console.log("📧 Email en Monday.com:", emailColumn.text);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

checkMondayUser();
