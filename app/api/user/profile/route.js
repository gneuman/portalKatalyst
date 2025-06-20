import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

export async function GET(req) {
  await connectMongo();
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) {
    return new Response(JSON.stringify({ error: "Email requerido" }), {
      status: 400,
    });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
      status: 404,
    });
  }
  // Log para consola del servidor
  console.log("Usuario encontrado en DB:", user);
  // Respuesta para el frontend
  return new Response(JSON.stringify(user), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PUT(req) {
  await connectMongo();
  const body = await req.json();
  const { email, ...updateData } = body;

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
    ];

    // Solo incluir campos que están presentes y son válidos
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updateFields[key] = updateData[key];
      }
    });

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
