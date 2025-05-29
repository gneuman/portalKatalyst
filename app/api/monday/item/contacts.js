import { postMonday } from "@/libs/monday";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  try {
    const { itemId, contactId } = req.body;
    if (!itemId || !contactId) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }
    // Actualizar el campo board_relation_mkrcrrm con el contactId
    const mutation = `mutation { change_column_value (item_id: ${itemId}, board_id: null, column_id: \"board_relation_mkrcrrm\", value: \"{\\"item_ids\\":[${contactId}]}\") { id } }`;
    const result = await postMonday(mutation);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
