import { postMonday } from "@/libs/monday";

export async function POST(req) {
  try {
    const { boardId } = await req.json();
    if (!boardId) {
      return new Response(JSON.stringify({ error: "Falta boardId" }), {
        status: 400,
      });
    }
    const query = `query { boards(ids: [${boardId}]) { columns { id title type settings_str } } }`;
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
