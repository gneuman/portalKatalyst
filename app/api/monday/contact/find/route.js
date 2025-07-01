import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    console.log("[monday/contact/find] Buscando email en Monday.com:", email);

    const boardId = process.env.MONDAY_BOARD_ID;
    const apiKey = process.env.MONDAY_API_KEY;

    // Primero obtener la estructura del board para encontrar la columna de email
    const boardQuery = `query { 
      boards(ids: [${boardId}]) { 
        id 
        name 
        columns { 
          id 
          title 
          type 
        } 
      } 
    }`;

    const boardRes = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "user-agent": "Make/production",
        "api-version": "2024-10",
        "content-type": "application/json",
        authorization: apiKey,
      },
      body: JSON.stringify({ query: boardQuery }),
    });

    const boardData = await boardRes.json();

    if (!boardRes.ok || boardData.errors) {
      console.error(
        "[monday/contact/find] Error obteniendo estructura del board:",
        boardData
      );
      return NextResponse.json(
        {
          error: "Error obteniendo estructura del board",
          details: boardData,
        },
        { status: 500 }
      );
    }

    const emailColumn = boardData?.data?.boards?.[0]?.columns?.find(
      (col) => col.type === "email"
    );

    if (!emailColumn) {
      console.error("[monday/contact/find] No se encontró columna de email");
      return NextResponse.json(
        {
          error: "No se encontró la columna de email en Monday.com",
        },
        { status: 500 }
      );
    }

    // Buscar el item por columna de email
    const searchQuery = `query {
      items_page_by_column_values (
        limit: 100,
        board_id: ${boardId},
        columns: [
          {
            column_id: "${emailColumn.id}",
            column_values: ["${email}"]
          }
        ]
      ) {
        items {
          id
          name
          column_values {
            id
            text
            value
            type
          }
        }
      }
    }`;

    // También buscar por nombre del item como respaldo (algunos items tienen el email como nombre)
    const searchByNameQuery = `query {
      items_page_by_column_values (
        limit: 100,
        board_id: ${boardId},
        columns: [
          {
            column_id: "name",
            column_values: ["${email}"]
          }
        ]
      ) {
        items {
          id
          name
          column_values {
            id
            text
            value
            type
          }
        }
      }
    }`;

    // Buscar por columna de email
    const searchRes = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "user-agent": "Make/production",
        "api-version": "2024-10",
        "content-type": "application/json",
        authorization: apiKey,
      },
      body: JSON.stringify({ query: searchQuery }),
    });

    const searchData = await searchRes.json();
    let items = [];

    if (searchRes.ok && !searchData.errors) {
      items = searchData?.data?.items_page_by_column_values?.items || [];
      console.log(
        "[monday/contact/find] Items encontrados por email:",
        items.length
      );
    } else {
      console.error(
        "[monday/contact/find] Error buscando por email:",
        searchData
      );
    }

    // Si no se encontró por email, buscar por nombre
    if (items.length === 0) {
      console.log("[monday/contact/find] Buscando por nombre como respaldo...");

      const searchByNameRes = await fetch("https://api.monday.com/v2", {
        method: "POST",
        headers: {
          "user-agent": "Make/production",
          "api-version": "2024-10",
          "content-type": "application/json",
          authorization: apiKey,
        },
        body: JSON.stringify({ query: searchByNameQuery }),
      });

      const searchByNameData = await searchByNameRes.json();

      if (searchByNameRes.ok && !searchByNameData.errors) {
        const nameItems =
          searchByNameData?.data?.items_page_by_column_values?.items || [];
        console.log(
          "[monday/contact/find] Items encontrados por nombre:",
          nameItems.length
        );

        // Combinar resultados y eliminar duplicados
        const allItems = [...items, ...nameItems];
        const uniqueItems = allItems.filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.id === item.id)
        );
        items = uniqueItems;
      } else {
        console.error(
          "[monday/contact/find] Error buscando por nombre:",
          searchByNameData
        );
      }
    }

    if (items.length > 0) {
      const item = items[0];
      console.log(
        "[monday/contact/find] Contacto encontrado en Monday.com:",
        item.id
      );

      return NextResponse.json({
        success: true,
        mondayId: item.id,
        name: item.name,
        found: true,
        item: item,
      });
    } else {
      console.log("[monday/contact/find] Contacto NO encontrado en Monday.com");

      return NextResponse.json({
        success: true,
        found: false,
        mondayId: null,
      });
    }
  } catch (error) {
    console.error("[monday/contact/find] Error:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
