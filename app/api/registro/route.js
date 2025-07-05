import { postMonday } from "@/libs/monday";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { boardId, katalystId, userName, razon } = await req.json();

    if (!boardId || !katalystId) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios: boardId y katalystId" },
        { status: 400 }
      );
    }

    console.log(`[REGISTRO] Iniciando aplicación a programa:`, {
      boardId,
      katalystId,
      userName,
      tieneRazon: !!razon,
    });

    // PASO 0: Validar que el board sea un programa válido
    const validateRes = await fetch(
      `${process.env.NEXTAUTH_URL}/api/registro/validate-board?boardId=${boardId}`
    );
    const validateData = await validateRes.json();

    if (!validateData.success || !validateData.esValido) {
      return NextResponse.json(
        { error: validateData.error || "Board no válido para aplicaciones" },
        { status: 400 }
      );
    }

    console.log(`[REGISTRO] Board validado:`, validateData.boardName);

    // PASO 1: Verificar si ya existe el contacto en este board
    const checkExistingQuery = `query {
      boards(ids: [${boardId}]) {
        id
        name
        columns {
          id
          title
          type
          settings_str
        }
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
          }
        }
      }
    }`;

    const checkExistingRes = await postMonday(checkExistingQuery);
    const board = checkExistingRes?.data?.boards?.[0];

    if (!board) {
      return NextResponse.json(
        { error: "No se encontró el board del programa" },
        { status: 404 }
      );
    }

    // Validar que board.columns existe
    if (!board.columns || !Array.isArray(board.columns)) {
      console.error(`[REGISTRO] Board sin columnas válidas:`, board);
      return NextResponse.json(
        { error: "El board del programa no tiene columnas válidas" },
        { status: 500 }
      );
    }

    console.log(
      `[REGISTRO] Board encontrado:`,
      board.name,
      `Columnas:`,
      board.columns.length
    );

    // Buscar si ya existe el contacto por MondayId Contacto
    const mondayIdContactoCol = board.columns.find(
      (col) =>
        col.title.toLowerCase().includes("mondayid contacto") ||
        col.title.toLowerCase().includes("monday id contacto")
    );

    let contactoExistente = null;

    if (mondayIdContactoCol) {
      // Buscar por MondayId Contacto
      for (const item of board.items_page?.items || []) {
        const mondayIdValue = item.column_values.find(
          (col) => col.column?.id === mondayIdContactoCol.id
        );
        if (mondayIdValue && mondayIdValue.text === katalystId) {
          contactoExistente = item;
          break;
        }
      }
    }

    // Si no se encontró por MondayId Contacto, buscar por relación de contacto
    if (!contactoExistente) {
      const contactColumn = board.columns.find(
        (col) =>
          col.type === "board_relation" ||
          col.title.toLowerCase().includes("contacto") ||
          col.title.toLowerCase().includes("contact")
      );

      if (contactColumn) {
        for (const item of board.items_page?.items || []) {
          const contactValue = item.column_values.find(
            (col) => col.column?.id === contactColumn.id
          );
          if (contactValue && contactValue.value) {
            try {
              const contactIds = JSON.parse(contactValue.value);
              if (
                contactIds.item_ids &&
                contactIds.item_ids.includes(parseInt(katalystId))
              ) {
                contactoExistente = item;
                break;
              }
            } catch (e) {
              console.log(`[REGISTRO] Error parsing contact column:`, e);
            }
          }
        }
      }
    }

    if (contactoExistente) {
      return NextResponse.json(
        {
          error: "Contacto ya registrado en este programa",
          itemId: contactoExistente.id,
          itemName: contactoExistente.name,
        },
        { status: 409 }
      );
    }

    console.log(
      `[REGISTRO] Contacto no existe, procediendo a crear nuevo registro`
    );

    // PASO 2: Obtener información del usuario desde el board de contactos
    const contactQuery = `query { 
      items(ids: [${katalystId}]) { 
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
    }`;

    const contactRes = await postMonday(contactQuery);
    const contactItem = contactRes?.data?.items?.[0];

    if (!contactItem) {
      return NextResponse.json(
        { error: "No se encontró el contacto en Monday.com" },
        { status: 404 }
      );
    }

    console.log(`[REGISTRO] Contacto encontrado:`, contactItem.name);

    // PASO 3: Preparar datos para crear el item en el board del programa
    const itemName = userName || contactItem.name || "Nuevo Participante";

    // Buscar columna de contacto en el board del programa
    const contactColumn = board.columns?.find(
      (col) =>
        col.title.toLowerCase().includes("contacto") ||
        col.title.toLowerCase().includes("contact") ||
        col.type === "board_relation"
    );
    const mondayIdContactoCol = board.columns.find(
      (col) =>
        col.title.toLowerCase().includes("mondayid contacto") ||
        col.title.toLowerCase().includes("monday id contacto")
    );

    // Siempre crear el item con MondayId Contacto y actualizarlo si es necesario
    const columnValues = [];
    if (contactColumn) {
      columnValues.push({
        column_id: contactColumn.id,
        value: JSON.stringify({ item_ids: [parseInt(katalystId)] }),
      });
    }
    if (mondayIdContactoCol) {
      columnValues.push({
        column_id: mondayIdContactoCol.id,
        value: JSON.stringify(katalystId),
        text: katalystId,
      });
    }
    // Agregar razón si aplica
    if (razon) {
      const razonCol = board.columns.find((col) =>
        col.title.toLowerCase().includes("razon")
      );
      if (razonCol) {
        columnValues.push({
          column_id: razonCol.id,
          value: JSON.stringify(razon),
          text: razon,
        });
      }
    }

    // Crear el item en el board destino
    const createItemMutation = `mutation {
      create_item (
        board_id: ${boardId},
        item_name: "${itemName}",
        column_values: "${
          columnValues.length > 0
            ? JSON.stringify(
                Object.fromEntries(
                  columnValues.map((cv) => [cv.column_id, cv.value])
                )
              )
            : "{}"
        }"
      ) {
        id
        name
      }
    }`;
    const createRes = await postMonday(createItemMutation);
    const newItem = createRes?.data?.create_item;

    if (!newItem) {
      return NextResponse.json(
        { error: "No se pudo crear el registro en el programa" },
        { status: 500 }
      );
    }

    // Si MondayId Contacto existe, actualizarlo siempre
    if (mondayIdContactoCol) {
      const updateMutation = `mutation {
        change_column_value (
          board_id: ${boardId},
          item_id: ${newItem.id},
          column_id: "${mondayIdContactoCol.id}",
          value: \"${katalystId}\"
        ) {
          id
        }
      }`;
      await postMonday(updateMutation);
    }

    console.log(
      `[REGISTRO] Item creado en programa:`,
      newItem.name,
      `(ID: ${newItem.id})`
    );

    return NextResponse.json({
      success: true,
      message: "Aplicación enviada exitosamente",
      itemId: newItem.id,
      itemName: newItem.name,
      boardName: board.name,
      status: "En revisión",
    });
  } catch (error) {
    console.error(`[REGISTRO] Error:`, error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}
