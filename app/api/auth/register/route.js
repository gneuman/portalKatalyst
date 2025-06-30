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
          personalMondayId: mondayUser.id, // Guardar el ID de Monday
          validado: userData.validado !== undefined ? userData.validado : false,
          updatedAt: new Date(),
          fotoPerfil: userData.fotoPerfil || fotoPerfilValue,
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

      // Si no existe en Monday.com y tenemos datos completos, crear el usuario
      if (userData.name && userData.firstName && userData.lastName) {
        console.log("=== CREANDO USUARIO EN MONDAY.COM ===");

        // Construir payload para Monday.com
        const mondayPayload = {
          name: userData.name,
          nombre: userData.firstName,
          apellidoP: userData.lastName,
          apellidoM: userData.secondLastName || "",
          genero: userData.gender || "",
          comunidad: userData.community || "Activo",
          telefono: userData.phone || "",
          email: email,
          pais: userData.pais || "MX",
          fechaNacimiento: userData.dateOfBirth || "",
          fotoPerfil: userData.fotoPerfil || "",
        };

        // Crear usuario directamente en Monday.com
        try {
          // Obtener la estructura del board
          const boardId = process.env.MONDAY_BOARD_ID;
          const boardQuery = `query { 
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
          }`;

          const boardResponse = await postMonday(boardQuery);
          const columns = boardResponse.data.boards[0].columns;

          // Mapeo de campos a columnas de Monday
          const columnMap = {
            nombre: columns.find((col) => col.title === "Nombre")?.id,
            apellidoP: columns.find((col) => col.title === "Apellido Paterno")
              ?.id,
            apellidoM: columns.find((col) => col.title === "Apellido Materno")
              ?.id,
            fechaNacimiento: columns.find(
              (col) => col.title === "Fecha Nacimiento"
            )?.id,
            comunidad: columns.find(
              (col) => col.title === "Comunidad" && col.type === "status"
            )?.id,
            genero: columns.find(
              (col) => col.title === "Género" && col.type === "dropdown"
            )?.id,
            foto: columns.find(
              (col) =>
                col.title === "Foto De Perfil" || col.title === "Foto de perfil"
            )?.id,
            email: columns.find((col) => col.type === "email")?.id,
            telefono: columns.find((col) => col.type === "phone")?.id,
          };

          // Construir valores de columnas
          const columnValuesObj = {};

          if (columnMap.nombre)
            columnValuesObj[columnMap.nombre] = mondayPayload.nombre;
          if (columnMap.apellidoP)
            columnValuesObj[columnMap.apellidoP] = mondayPayload.apellidoP;
          if (columnMap.apellidoM)
            columnValuesObj[columnMap.apellidoM] = mondayPayload.apellidoM;
          if (columnMap.fechaNacimiento && mondayPayload.fechaNacimiento) {
            columnValuesObj[columnMap.fechaNacimiento] = {
              date: mondayPayload.fechaNacimiento,
            };
          }
          if (columnMap.comunidad)
            columnValuesObj[columnMap.comunidad] = {
              label: mondayPayload.comunidad,
            };
          if (columnMap.genero && mondayPayload.genero) {
            columnValuesObj[columnMap.genero] = {
              labels: [mondayPayload.genero],
            };
          }
          if (columnMap.foto && mondayPayload.fotoPerfil)
            columnValuesObj[columnMap.foto] = mondayPayload.fotoPerfil;
          if (columnMap.email) {
            columnValuesObj[columnMap.email] = {
              text: mondayPayload.email,
              email: mondayPayload.email,
            };
          }
          if (columnMap.telefono && mondayPayload.telefono) {
            columnValuesObj[columnMap.telefono] = {
              phone: mondayPayload.telefono,
              countryShortName: mondayPayload.pais || "MX",
            };
          }

          let columnValuesStr = JSON.stringify(columnValuesObj);
          columnValuesStr = columnValuesStr.replace(/"/g, '\\"');

          // Crear el item en Monday
          const mutation = {
            query: `mutation { create_item (board_id: ${boardId}, group_id: \"group_mkqkvhv4\", item_name: \"${mondayPayload.name}\", column_values: \"${columnValuesStr}\", create_labels_if_missing: false) { id } }`,
          };

          const createResponse = await postMonday(mutation.query);

          if (createResponse.data?.create_item?.id) {
            const mondayId = createResponse.data.create_item.id;
            console.log("Usuario creado en Monday.com:", mondayId);

            // Guardar en MongoDB con el ID de Monday
            await connectDB();
            const userPayload = {
              email,
              name: userData.name,
              firstName: userData.firstName,
              lastName: userData.lastName,
              secondLastName: userData.secondLastName,
              phone: userData.phone,
              dateOfBirth: userData.dateOfBirth,
              gender: userData.gender,
              community: userData.community,
              fotoPerfil: userData.fotoPerfil,
              personalMondayId: mondayId, // Guardar el ID de Monday
              emailVerified: new Date(),
              businessMondayId: [],
              validado: false,
              updatedAt: new Date(),
            };

            await User.updateOne(
              { email },
              { $set: userPayload },
              { upsert: true }
            );

            console.log("[MongoDB] Usuario creado con Monday ID:", mondayId);

            return NextResponse.json({
              success: true,
              message: "Usuario creado exitosamente en Monday.com y MongoDB",
              personalMondayId: mondayId,
            });
          } else {
            throw new Error("No se pudo crear el usuario en Monday.com");
          }
        } catch (createError) {
          console.error("Error al crear usuario en Monday:", createError);
          throw new Error(
            "Error al crear usuario en Monday.com: " + createError.message
          );
        }
      }

      // Si no existe en Monday.com y no tenemos datos completos, retornar éxito para mostrar formulario vacío
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
