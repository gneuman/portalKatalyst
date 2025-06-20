import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/app/models/User";
import { postMonday } from "@/libs/monday";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

export async function POST(request) {
  try {
    const { email, ...userData } = await request.json();
    console.log("[register] Payload recibido:", { email, userData });

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    // 1. Obtener la estructura del tablero primero
    const boardId = process.env.MONDAY_BOARD_ID;
    console.log("=== OBTENIENDO ESTRUCTURA DEL TABLERO ===");
    console.log("Board ID:", boardId);

    const boardQuery = `
      query {
        boards(ids: [${boardId}]) {
          id
          name
          columns {
            id
            title
            type
            settings_str
          }
        }
      }
    `;

    console.log("Query de estructura:", boardQuery);

    const boardData = await postMonday(boardQuery);
    console.log("Estructura del tablero:", JSON.stringify(boardData, null, 2));

    // Encontrar el ID de la columna Email
    const emailColumn = boardData.data.boards[0].columns.find(
      (col) => col.title.toLowerCase() === "email"
    );

    if (!emailColumn) {
      console.error("No se encontró la columna Email en el tablero");
      return NextResponse.json(
        { error: "No se encontró la columna Email en el tablero" },
        { status: 500 }
      );
    }

    console.log("ID de columna Email encontrado:", emailColumn.id);

    // 2. Buscar en Monday.com usando el ID de columna correcto
    console.log("=== BUSCANDO USUARIO EN MONDAY ===");

    const searchQuery = `
      query {
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
          cursor
          items {
            id
            name
            created_at
            updated_at
            board {
              id
            }
            creator_id
            group {
              id
            }
            column_values {
              id
              value
              text
              ...on MirrorValue {
                display_value
              }
              ...on BoardRelationValue {
                display_value
              }
              ...on DependencyValue {
                display_value
              }
              ...on StatusValue {
                label
                updated_at
                label_style {
                  color
                }
              }
              ...on NumbersValue {
                symbol
                direction
              }
              ...on TimeTrackingValue {
                column {
                  type
                }
                history {
                  id
                  started_user_id
                  ended_user_id
                  started_at
                  ended_at
                  manually_entered_start_time
                  manually_entered_end_time
                  manually_entered_start_date
                  manually_entered_end_date
                  created_at
                  updated_at
                  status
                }
              }
            }
          }
        }
      }
    `;

    console.log("Query de búsqueda:", searchQuery);

    try {
      const mondayData = await postMonday(searchQuery);
      console.log("Respuesta de Monday:", JSON.stringify(mondayData, null, 2));

      if (mondayData.data?.items_page_by_column_values?.items?.length > 0) {
        const mondayUser = mondayData.data.items_page_by_column_values.items[0];
        console.log(
          "Usuario encontrado en Monday:",
          JSON.stringify(mondayUser, null, 2)
        );

        const columnValues = {};
        mondayUser.column_values.forEach((col) => {
          columnValues[col.id] = col.text || col.value || "";
        });

        console.log(
          "Valores de columnas:",
          JSON.stringify(columnValues, null, 2)
        );

        // Buscar el campo de foto de perfil por título o id
        let fotoPerfilValue = "";
        for (const key of Object.keys(columnValues)) {
          if (key.toLowerCase().includes("foto")) {
            fotoPerfilValue = columnValues[key];
            break;
          }
        }

        // Redirigir a la página de actualización
        await resend.contacts.create({
          email: email,
          firstName: mondayUser.name.split(" ")[0] || "",
          lastName: mondayUser.name.split(" ").slice(1).join(" ") || "",
          unsubscribed: false,
          audienceId: RESEND_AUDIENCE_ID,
        });
        console.log(
          "[Resend] Contacto agregado a la audiencia Katalyst:",
          email
        );

        // Guardar o actualizar usuario en MongoDB con todos los datos relevantes
        await connectDB();
        const userPayload = {
          email,
          emailVerified: userData.emailVerified || new Date(),
          businessMondayId: userData.businessMondayId || [],
          personalMondayId: userData.personalMondayId || "",
          validado: userData.validado !== undefined ? userData.validado : false,
          updatedAt: new Date(),
          fotoPerfil: userData.fotoPerfil || "",
          // Puedes agregar aquí más campos si tu modelo lo permite
        };
        await User.updateOne(
          { email },
          { $set: userPayload },
          { upsert: true }
        );
        console.log("[MongoDB] Usuario guardado/actualizado:", userPayload);

        return NextResponse.json({
          redirect: `/update?email=${encodeURIComponent(email)}`,
          userData: {
            email: email,
            columnValues,
            name: mondayUser.name,
            firstName:
              columnValues[
                Object.keys(columnValues).find((key) => key.includes("nombre"))
              ] || "",
            lastName:
              columnValues[
                Object.keys(columnValues).find((key) =>
                  key.includes("apellidoP")
                )
              ] || "",
            secondLastName:
              columnValues[
                Object.keys(columnValues).find((key) =>
                  key.includes("apellidoM")
                )
              ] || "",
            phone:
              columnValues[
                Object.keys(columnValues).find((key) =>
                  key.includes("telefono")
                )
              ] || "",
            dateOfBirth:
              columnValues[
                Object.keys(columnValues).find((key) => key.includes("fecha"))
              ] || "",
            gender:
              columnValues[
                Object.keys(columnValues).find((key) => key.includes("genero"))
              ] || "",
            community: columnValues["status"] || "",
            fotoPerfil: fotoPerfilValue,
            personalMondayId: mondayUser.id,
          },
          needsUpdate: true,
        });
      }

      console.log("No se encontró usuario en Monday.com");
      // Si no existe en Monday.com, retornar éxito para mostrar formulario vacío
      return NextResponse.json({
        success: true,
        message: "Usuario no encontrado, proceder con registro",
        needsValidation: false,
      });
    } catch (mondayError) {
      console.error("Error específico de Monday:", mondayError);
      throw mondayError;
    }
  } catch (error) {
    console.error("Error en el registro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
