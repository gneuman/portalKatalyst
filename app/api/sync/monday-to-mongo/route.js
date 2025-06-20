import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/User";
import { postMonday } from "@/libs/monday";

export async function POST(_request) {
  try {
    await connectDB();

    // 1. Obtener todos los contactos de Monday.com
    const boardId = process.env.MONDAY_CONTACTS_BOARD_ID;
    const query = `query {
      boards (ids: [${boardId}]) {
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

    const mondayResponse = await postMonday(query);
    const contacts = mondayResponse?.data?.boards?.[0]?.items || [];

    // 2. Procesar cada contacto
    const results = {
      created: 0,
      updated: 0,
      errors: [],
    };

    for (const contact of contacts) {
      try {
        // Extraer datos relevantes
        const email = contact.column_values.find(
          (col) => col.type === "email"
        )?.text;
        if (!email) continue;

        // Buscar usuario existente
        let user = await User.findOne({ email });

        // Preparar datos del usuario
        const userData = {
          email,
          name: contact.name,
          personalMondayId: contact.id,
          updatedAt: new Date(),
        };

        if (user) {
          // Actualizar usuario existente
          Object.assign(user, userData);
          await user.save();
          results.updated++;
        } else {
          // Crear nuevo usuario
          await User.create(userData);
          results.created++;
        }
      } catch (error) {
        results.errors.push({
          contactId: contact.id,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      totalProcessed: contacts.length,
    });
  } catch (error) {
    console.error("[sync-monday-to-mongo] Error:", error);
    return NextResponse.json(
      { error: error.message || "Error en la sincronización" },
      { status: 500 }
    );
  }
}
