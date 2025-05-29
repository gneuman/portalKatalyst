import { postMonday } from "@/libs/monday";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: "Falta email" });
  }
  // Ajusta el boardId al de contactos
  const boardId = process.env.MONDAY_CONTACTS_BOARD_ID;
  const query = `query { items_by_column_values (board_id: ${boardId}, column_id: \"email\", column_value: \"${email}\") { id name column_values { id text value } } }`;
  const data = await postMonday(query);
  const items = data?.data?.items_by_column_values || [];
  if (items.length > 0) {
    return res.status(200).json(items[0]);
  }
  return res.status(200).json(null);
}
