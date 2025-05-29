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
  const { email, businessMondayId } = body;
  if (!email || !businessMondayId) {
    return new Response(JSON.stringify({ error: "Faltan parámetros" }), {
      status: 400,
    });
  }
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { businessMondayId } },
    { new: true }
  );
  if (!user) {
    return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
      status: 404,
    });
  }
  return new Response(JSON.stringify(user), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
