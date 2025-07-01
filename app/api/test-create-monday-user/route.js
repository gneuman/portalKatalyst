import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email, apiKey, boardId } = await request.json();
    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    // Usar boardId y apiKey proporcionados o los del entorno
    const usedBoardId = boardId || process.env.MONDAY_BOARD_ID;
    const usedApiKey = apiKey || process.env.MONDAY_API_KEY;

    // Crear el item solo con el email (como en el curl de Make)
    const columnValues = "{}"; // Empty object como en el curl de Make
    const mutationQuery = `mutation { create_item (board_id: ${usedBoardId}, item_name: "${email}", column_values: "${columnValues}", create_labels_if_missing: false) { id } }`;

    // Construir el curl exacto que se está enviando
    const curlCommand = `curl -X POST 'https://api.monday.com/v2' \\
  -H 'user-agent: Make/production' \\
  -H 'api-version: 2024-10' \\
  -H 'content-type: application/json' \\
  -H 'authorization: ${usedApiKey}' \\
  -d '{"query":"${mutationQuery}"}'`;

    // Llamada a Monday.com con los headers de Make
    const res = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "user-agent": "Make/production",
        "api-version": "2024-10",
        "content-type": "application/json",
        authorization: usedApiKey,
      },
      body: JSON.stringify({ query: mutationQuery }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `HTTP error! status: ${res.status}`,
          details: data,
          curlCommand,
          mutationQuery,
        },
        { status: res.status }
      );
    }

    if (data.errors) {
      return NextResponse.json(
        {
          error: "Monday.com errors",
          details: data.errors,
          curlCommand,
          mutationQuery,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      mondayId: data.data?.create_item?.id,
      details: data,
      curlCommand,
      mutationQuery,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
