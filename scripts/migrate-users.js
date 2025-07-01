const { MongoClient } = require("mongodb");

async function migrateUsers() {
  const uri =
    "mongodb+srv://gneuman:PrFXwRrt1783GeFr@katalyst.dsegh0e.mongodb.net/?retryWrites=true&w=majority&appName=katalyst";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Conectado a MongoDB");

    const db = client.db();

    // Buscar usuarios que necesitan migración
    const users = await db.collection("users").find({}).toArray();
    console.log(`📊 Encontrados ${users.length} usuarios para revisar`);

    let migrated = 0;
    let errors = 0;

    for (const user of users) {
      try {
        const updates = {};
        let needsUpdate = false;

        // Agregar campos faltantes
        if (!user.role) {
          updates.role = "user";
          needsUpdate = true;
        }

        if (!user.lastLogin) {
          updates.lastLogin = user.createdAt || new Date();
          needsUpdate = true;
        }

        if (!user.createdAt) {
          updates.createdAt = user.updatedAt || new Date();
          needsUpdate = true;
        }

        if (!user.image && user.fotoPerfil) {
          updates.image = user.fotoPerfil;
          needsUpdate = true;
        }

        // Asegurar que emailVerified esté presente
        if (!user.emailVerified && user.validado) {
          updates.emailVerified = user.updatedAt || new Date();
          needsUpdate = true;
        }

        if (needsUpdate) {
          await db
            .collection("users")
            .updateOne({ _id: user._id }, { $set: updates });
          migrated++;
          console.log(`✅ Usuario migrado: ${user.email}`);
        } else {
          console.log(`ℹ️ Usuario ya actualizado: ${user.email}`);
        }
      } catch (error) {
        console.error(
          `❌ Error migrando usuario ${user.email}:`,
          error.message
        );
        errors++;
      }
    }

    console.log(`\n🎉 Migración completada:`);
    console.log(`   ✅ Usuarios migrados: ${migrated}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📊 Total procesados: ${users.length}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

migrateUsers();
