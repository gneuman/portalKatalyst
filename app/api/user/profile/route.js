import connectMongo from "@/libs/mongoose";
import User from "@/app/models/User";

export async function GET(req) {
  await connectMongo();
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) {
    return new Response(JSON.stringify({ error: "Email requerido" }), {
      status: 400,
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
        status: 404,
      });
    }

    // Log para consola del servidor
    console.log("Usuario encontrado en DB:", user);

    // Si el usuario tiene personalMondayId, obtener datos de Monday.com
    let columnValues = null;
    if (user.personalMondayId) {
      try {
        const query = `query { items (ids: [${user.personalMondayId}]) { id name board { id } column_values { id text value column { id title id } } } }`;
        const mondayRes = await fetch(
          `${process.env.NEXTAUTH_URL}/api/monday/item`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
          }
        );

        if (mondayRes.ok) {
          const mondayData = await mondayRes.json();
          console.log(
            "[PROFILE] Respuesta de Monday.com:",
            JSON.stringify(mondayData, null, 2)
          );
          const item = mondayData?.data?.items?.[0];
          if (item && item.column_values) {
            columnValues = {};
            item.column_values.forEach((col) => {
              console.log(
                `[PROFILE] Procesando columna: ${col.column?.title} (tipo: ${col.column?.type})`
              );

              // Para campos de teléfono, mantener el objeto completo
              if (col.column?.title === "Teléfono" && col.value) {
                try {
                  columnValues[col.id] = JSON.parse(col.value);
                } catch {
                  columnValues[col.id] = col.text || col.value || "";
                }
              }
              // Para campos de tipo status, usar el valor del status
              else if (col.column?.type === "status") {
                columnValues[col.id] = col.value || "";
                console.log(
                  `[PROFILE] Campo status encontrado: ${col.column?.title} = ${col.value}`
                );
              }
              // Para otros campos, usar texto o valor
              else {
                columnValues[col.id] = col.text || col.value || "";
              }
            });
          }
        }
      } catch (mondayError) {
        console.error("Error al obtener datos de Monday.com:", mondayError);
        // No fallar si Monday no responde
      }
    }

    // Respuesta para el frontend incluyendo columnValues si están disponibles
    const response = {
      ...user.toObject(),
      columnValues,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      {
        status: 500,
      }
    );
  }
}

export async function PUT(req) {
  await connectMongo();
  const body = await req.json();
  const { email, nuevoEmail, ...updateData } = body;

  if (!email) {
    return new Response(JSON.stringify({ error: "Email requerido" }), {
      status: 400,
    });
  }

  try {
    // Construir objeto de actualización dinámicamente
    const updateFields = {};

    // Campos permitidos para actualización
    const allowedFields = [
      "fotoPerfil",
      "name",
      "firstName",
      "lastName",
      "secondLastName",
      "phone",
      "dateOfBirth",
      "gender",
      "community",
      "comunidad",
      "personalMondayId",
      "businessMondayId",
      "isVerified",
      "email",
    ];

    // Solo incluir campos que están presentes y son válidos
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updateFields[key] = updateData[key];
      }
    });

    // Si hay un nuevo email, actualizarlo
    if (nuevoEmail && nuevoEmail !== email) {
      updateFields.email = nuevoEmail;
    }

    if (Object.keys(updateFields).length === 0) {
      return new Response(
        JSON.stringify({ error: "No hay campos válidos para actualizar" }),
        {
          status: 400,
        }
      );
    }

    console.log(
      "[MONGODB] Actualizando usuario:",
      email,
      "con campos:",
      updateFields
    );

    const user = await User.findOneAndUpdate(
      { email },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!user) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
        status: 404,
      });
    }

    console.log("[MONGODB] Usuario actualizado exitosamente:", user._id);

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[MONGODB] Error al actualizar usuario:", error);
    return new Response(
      JSON.stringify({
        error: "Error al actualizar usuario",
        details: error.message,
      }),
      {
        status: 500,
      }
    );
  }
}
