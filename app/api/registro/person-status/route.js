import { postMonday } from "@/libs/monday";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const katalystId = searchParams.get("katalystId");
    const boardId = searchParams.get("boardId");

    if (!katalystId || !boardId) {
      return NextResponse.json(
        { error: "katalystId y boardId son requeridos" },
        { status: 400 }
      );
    }

    console.log(
      `[PERSON-STATUS] Consultando status de ${katalystId} en board ${boardId}`
    );

    // PASO 1: Buscar el item de la persona en el board
    const query = `query {
      boards(ids: [${boardId}]) {
        id
        name
        items_page(limit: 100) {
          items {
            id
            name
            column_values {
              id
              text
              value
              column {
                id
                title
                type
              }
            }
            subitems {
              id
              name
              column_values {
                id
                text
                value
                column {
                  id
                  title
                  type
                }
              }
            }
          }
        }
      }
    }`;

    const res = await postMonday(query);
    const board = res?.data?.boards?.[0];

    if (!board) {
      return NextResponse.json(
        { error: "Board no encontrado" },
        { status: 404 }
      );
    }

    const items = board.items_page?.items || [];
    let personItem = null;
    let status = "No aplicado";
    let tieneOnboarding = false;
    let tieneRazon = false;
    let subitems = [];

    // PASO 2: Buscar el item de la persona
    for (const item of items) {
      // Buscar por MondayId Contacto (campo de texto)
      const mondayIdCol = item.column_values.find(
        (col) =>
          col.column?.title?.toLowerCase().includes("mondayid contacto") ||
          col.column?.title?.toLowerCase().includes("monday id contacto")
      );

      if (mondayIdCol && mondayIdCol.text === katalystId) {
        personItem = item;
        break;
      }

      // También buscar por columna de contacto (board_relation)
      const contactColumn = item.column_values.find(
        (col) =>
          col.column?.type === "board_relation" ||
          col.column?.title?.toLowerCase().includes("contacto") ||
          col.column?.title?.toLowerCase().includes("contact")
      );

      if (contactColumn && contactColumn.value) {
        try {
          const contactIds = JSON.parse(contactColumn.value);
          if (
            contactIds.item_ids &&
            contactIds.item_ids.includes(parseInt(katalystId))
          ) {
            personItem = item;
            break;
          }
        } catch (e) {
          console.log(`[PERSON-STATUS] Error parsing contact column:`, e);
        }
      }
    }

    // PASO 3: Si se encontró la persona, obtener su status
    if (personItem) {
      // Buscar columna de status
      const statusColumn = personItem.column_values.find(
        (col) =>
          col.column?.type === "status" ||
          col.column?.title?.toLowerCase().includes("status") ||
          col.column?.title?.toLowerCase().includes("estado")
      );

      status = statusColumn?.text || "En revisión";

      // Verificar subitems
      subitems = personItem.subitems || [];

      // Verificar si tiene onboarding
      tieneOnboarding = subitems.some((sub) =>
        sub.name.toLowerCase().includes("onboarding")
      );

      // Verificar si tiene campo de razón
      const razonColumn = personItem.column_values.find(
        (col) =>
          col.column?.title?.toLowerCase().includes("razón") ||
          col.column?.title?.toLowerCase().includes("razon") ||
          col.column?.title?.toLowerCase().includes("reason")
      );

      tieneRazon =
        razonColumn && razonColumn.text && razonColumn.text.trim() !== "";
    }

    console.log(`[PERSON-STATUS] Status encontrado:`, {
      encontrado: !!personItem,
      status,
      tieneOnboarding,
      tieneRazon,
      subitemsCount: subitems.length,
    });

    return NextResponse.json({
      success: true,
      encontrado: !!personItem,
      itemId: personItem?.id,
      itemName: personItem?.name,
      status,
      tieneOnboarding,
      tieneRazon,
      subitems: subitems.map((sub) => ({
        id: sub.id,
        name: sub.name,
        column_values: sub.column_values,
      })),
      boardName: board.name,
    });
  } catch (error) {
    console.error(`[PERSON-STATUS] Error:`, error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}
