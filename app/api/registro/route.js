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
      return NextResponse.json(
        { error: "El board del programa no tiene columnas válidas" },
        { status: 500 }
      );
    }

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
              // Error parsing contact column
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

    // PASO 3: Preparar datos para crear el item en el board del programa
    const itemName = userName || contactItem.name || "Nuevo Participante";

    // Buscar columna de contacto en el board del programa
    const contactColumn = board.columns?.find(
      (col) =>
        col.title.toLowerCase().includes("contacto") ||
        col.title.toLowerCase().includes("contact") ||
        col.type === "board_relation"
    );

    if (!contactColumn) {
      return NextResponse.json(
        {
          error: "No se encontró columna de contacto en el board del programa",
        },
        { status: 400 }
      );
    }

    // Buscar columna de razón de forma programática
    const razonColumn = board.columns?.find(
      (col) =>
        col.title.toLowerCase().includes("razón") ||
        col.title.toLowerCase().includes("razon") ||
        col.title.toLowerCase().includes("reason") ||
        col.title.toLowerCase().includes("motivo") ||
        col.title.toLowerCase().includes("por qué") ||
        col.title.toLowerCase().includes("por que")
    );

    // PASO 4: Crear item en el board del programa
    const columnValues = {
      [contactColumn.id]: { item_ids: [parseInt(katalystId)] },
    };

    // Agregar MondayId Contacto si existe la columna
    if (mondayIdContactoCol) {
      columnValues[mondayIdContactoCol.id] = katalystId;
    }

    // Agregar razón si existe la columna y se proporcionó
    if (razonColumn && razon) {
      columnValues[razonColumn.id] = razon;
    }

    const createItemQuery = `mutation { 
      create_item (
        board_id: ${boardId}, 
        item_name: "${itemName}",
        column_values: "${JSON.stringify(columnValues).replace(/"/g, '\\"')}"
      ) { 
        id 
        name 
      } 
    }`;

    const createItemRes = await postMonday(createItemQuery);
    const newItem = createItemRes?.data?.create_item;

    if (!newItem) {
      return NextResponse.json(
        { error: "No se pudo crear el item en el programa" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Aplicación enviada exitosamente",
      itemId: newItem.id,
      itemName: newItem.name,
      boardName: board.name,
      status: "En revisión",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}
