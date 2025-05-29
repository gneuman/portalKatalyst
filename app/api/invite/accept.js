import connectMongo from "@/libs/mongoose";
import Invite from "@/models/Invite";
import User from "@/models/User";
import { postMonday } from "@/libs/monday";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  const { token, nombre } = (await req.body) ? JSON.parse(req.body) : req.body;
  if (!token) {
    return res.status(400).json({ error: "Falta token" });
  }
  await connectMongo();
  const invite = await Invite.findOne({ token });
  if (!invite || invite.status !== "pending") {
    return res.status(400).json({ error: "Invitación no válida" });
  }
  let user = await User.findOne({ email: invite.email });
  let personalMondayId = user?.personalMondayId;
  // 1. Si el usuario es nuevo, crear contacto en Monday y MongoDB
  if (!user) {
    // Crear contacto en Monday
    const boardIdContactos = process.env.MONDAY_CONTACTS_BOARD_ID;
    const mutation = `mutation { create_item (board_id: ${boardIdContactos}, item_name: \"${nombre}\", column_values: \"{\\"email\\":\\"${invite.email}\\"}\") { id } }`;
    const mondayRes = await postMonday(mutation);
    personalMondayId = mondayRes?.data?.create_item?.id;
    if (!personalMondayId) {
      return res
        .status(500)
        .json({ error: "No se pudo crear el contacto en Monday" });
    }
    // Crear usuario en MongoDB
    user = await User.create({
      email: invite.email,
      name: nombre,
      businessMondayId: [invite.empresaId],
      personalMondayId,
    });
  } else {
    // Si no tiene personalMondayId, buscarlo en Monday
    if (!user.personalMondayId) {
      // Buscar contacto en Monday
      const boardIdContactos = process.env.MONDAY_CONTACTS_BOARD_ID;
      const query = `query { items_by_column_values (board_id: ${boardIdContactos}, column_id: \"email\", column_value: \"${invite.email}\") { id } }`;
      const mondayRes = await postMonday(query);
      personalMondayId = mondayRes?.data?.items_by_column_values?.[0]?.id;
      if (personalMondayId) {
        user.personalMondayId = personalMondayId;
        await user.save();
      }
    }
    // Asociar empresa si no está
    if (!user.businessMondayId.includes(invite.empresaId)) {
      user.businessMondayId.push(invite.empresaId);
      await user.save();
    }
  }
  // 2. Asociar el contacto a la empresa en Monday
  if (personalMondayId) {
    // Obtener boardId de la empresa (puedes guardarlo en la invitación si tienes varios boards)
    const boardIdEmpresa = process.env.MONDAY_EMPRESAS_BOARD_ID;
    const mutationRelacion = `mutation { change_multiple_column_values (board_id: ${boardIdEmpresa}, item_id: ${invite.empresaId}, column_values: "{ \"board_relation_mkrcrrm\": {\"item_ids\":[${personalMondayId}]} }", create_labels_if_missing: false) { id } }`;
    const relacionRes = await postMonday(mutationRelacion);
    if (!relacionRes?.data?.change_multiple_column_values?.id) {
      return res.status(500).json({
        error: "No se pudo asociar el contacto a la empresa en Monday",
      });
    }
  }
  // Marcar invitación como aceptada
  invite.status = "accepted";
  await invite.save();
  res.status(200).json({ ok: true });
}
