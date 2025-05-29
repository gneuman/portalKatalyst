import { postMonday } from "@/libs/monday";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Falta el query" });
    }
    const mondayRes = await postMonday(query);
    return res.status(200).json(mondayRes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
