import connectMongo from "@/libs/mongoose";
import Invite from "@/models/Invite";
import User from "@/models/User";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: "Falta token" });
  }
  await connectMongo();
  const invite = await Invite.findOne({ token });
  if (!invite) {
    return res.status(404).json({ error: "Invitación no encontrada" });
  }
  // Buscar si el usuario ya existe
  const user = await User.findOne({ email: invite.email });
  res.status(200).json({
    email: invite.email,
    empresaId: invite.empresaId,
    status: invite.status,
    isNew: !user,
    nombre: user?.name || "",
  });
}
