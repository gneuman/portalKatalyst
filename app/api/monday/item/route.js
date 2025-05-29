import { postMonday } from "@/libs/monday";

export async function POST(req) {
  try {
    const { query } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Falta el query" }), {
        status: 400,
      });
    }
    const mondayRes = await postMonday(query);
    return new Response(JSON.stringify(mondayRes), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
