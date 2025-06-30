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

    // 1. BUSCAR EN MONGODB PRIMERO
    console.log("=== BUSCANDO EN MONGODB ===");
    await connectDB();
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("Usuario encontrado en MongoDB:", existingUser._id);

      // Si existe en MongoDB, enviar correo de verificación
      await resend.contacts.create({
        email: email,
        firstName:
          existingUser.firstName || existingUser.name?.split(" ")[0] || "",
        lastName:
          existingUser.lastName ||
          existingUser.name?.split(" ").slice(1).join(" ") ||
          "",
        unsubscribed: false,
        audienceId: RESEND_AUDIENCE_ID,
      });
      console.log("[Resend] Contacto agregado a la audiencia Katalyst:", email);

      return NextResponse.json({
        redirect: `/auth/verify-request?email=${encodeURIComponent(email)}`,
        message: "Usuario ya existe, redirigiendo a verificación",
      });
    }

    console.log("Usuario no encontrado en MongoDB, buscando en Monday.com");

    // 2. SI NO EXISTE EN MONGODB, BUSCAR EN MONDAY.COM
    const boardId = process.env.MONDAY_BOARD_ID;
    console.log("=== BUSCANDO EN MONDAY.COM ===");
    console.log("Board ID:", boardId);

    // Obtener estructura del tablero
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

    const boardData = await postMonday(boardQuery);
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

    // Buscar usuario en Monday.com por email
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

    const mondayData = await postMonday(searchQuery);
    console.log("Respuesta de Monday:", JSON.stringify(mondayData, null, 2));

    if (mondayData.data?.items_page_by_column_values?.items?.length > 0) {
      // 2.1 SI EXISTE EN MONDAY, COPIAR DATOS A MONGODB
      console.log("=== USUARIO ENCONTRADO EN MONDAY, COPIANDO DATOS ===");

      const mondayUser = mondayData.data.items_page_by_column_values.items[0];
      const columnValues = {};
      mondayUser.column_values.forEach((col) => {
        columnValues[col.id] = col.text || col.value || "";
      });

      // Extraer datos de las columnas
      const nombreCol = Object.keys(columnValues).find(
        (key) =>
          columnValues[key] &&
          key.toLowerCase().includes("nombre") &&
          !key.toLowerCase().includes("apellido")
      );
      const apellidoPCol = Object.keys(columnValues).find(
        (key) =>
          columnValues[key] &&
          key.toLowerCase().includes("apellido") &&
          key.toLowerCase().includes("paterno")
      );
      const apellidoMCol = Object.keys(columnValues).find(
        (key) =>
          columnValues[key] &&
          key.toLowerCase().includes("apellido") &&
          key.toLowerCase().includes("materno")
      );
      const telefonoCol = Object.keys(columnValues).find(
        (key) => columnValues[key] && key.toLowerCase().includes("telefono")
      );
      const fechaCol = Object.keys(columnValues).find(
        (key) => columnValues[key] && key.toLowerCase().includes("fecha")
      );
      const generoCol = Object.keys(columnValues).find(
        (key) => columnValues[key] && key.toLowerCase().includes("genero")
      );
      const comunidadCol = Object.keys(columnValues).find(
        (key) => columnValues[key] && key.toLowerCase().includes("comunidad")
      );
      const fotoCol = Object.keys(columnValues).find(
        (key) => columnValues[key] && key.toLowerCase().includes("foto")
      );

      // Crear usuario en MongoDB con datos de Monday
      const mongoUser = {
        email,
        name: mondayUser.name,
        firstName: nombreCol
          ? columnValues[nombreCol]
          : mondayUser.name.split(" ")[0] || "",
        lastName: apellidoPCol
          ? columnValues[apellidoPCol]
          : mondayUser.name.split(" ").slice(1).join(" ") || "",
        secondLastName: apellidoMCol ? columnValues[apellidoMCol] : "",
        phone: telefonoCol ? columnValues[telefonoCol] : "",
        dateOfBirth: fechaCol ? columnValues[fechaCol] : "",
        gender: generoCol ? columnValues[generoCol] : "",
        community: comunidadCol ? columnValues[comunidadCol] : "",
        fotoPerfil: fotoCol ? columnValues[fotoCol] : "",
        personalMondayId: mondayUser.id,
        emailVerified: new Date(),
        businessMondayId: [],
        validado: false,
        updatedAt: new Date(),
      };

      await User.create(mongoUser);
      console.log(
        "[MongoDB] Usuario creado con datos de Monday:",
        mongoUser._id
      );

      // Enviar correo
      await resend.contacts.create({
        email: email,
        firstName: mongoUser.firstName,
        lastName: mongoUser.lastName,
        unsubscribed: false,
        audienceId: RESEND_AUDIENCE_ID,
      });
      console.log("[Resend] Contacto agregado a la audiencia Katalyst:", email);

      return NextResponse.json({
        redirect: `/auth/verify-request?email=${encodeURIComponent(email)}`,
        message: "Usuario encontrado en Monday, datos copiados a MongoDB",
      });
    } else {
      // 2.2 SI NO EXISTE EN MONDAY, CREAR RECORD BÁSICO
      console.log(
        "=== USUARIO NO ENCONTRADO EN MONDAY, CREANDO RECORD BÁSICO ==="
      );

      // Crear record básico en Monday.com solo con el email
      const columnValuesObj = {};
      columnValuesObj[emailColumn.id] = {
        text: email,
        email: email,
      };

      let columnValuesStr = JSON.stringify(columnValuesObj);
      columnValuesStr = columnValuesStr.replace(/"/g, '\\"');

      const mutation = {
        query: `mutation { create_item (board_id: ${boardId}, group_id: \"group_mkqkvhv4\", item_name: \"${email}\", column_values: \"${columnValuesStr}\", create_labels_if_missing: false) { id } }`,
      };

      const createResponse = await postMonday(mutation.query);

      if (createResponse.data?.create_item?.id) {
        const mondayId = createResponse.data.create_item.id;
        console.log("Record básico creado en Monday.com:", mondayId);

        // Crear usuario básico en MongoDB
        const basicUser = {
          email,
          name: email,
          personalMondayId: mondayId,
          emailVerified: new Date(),
          businessMondayId: [],
          validado: false,
          updatedAt: new Date(),
        };

        await User.create(basicUser);
        console.log("[MongoDB] Usuario básico creado:", basicUser._id);

        // Enviar correo también cuando se crea un record básico
        await resend.contacts.create({
          email: email,
          firstName: email.split("@")[0], // Usar parte del email como nombre temporal
          lastName: "",
          unsubscribed: false,
          audienceId: RESEND_AUDIENCE_ID,
        });
        console.log(
          "[Resend] Contacto agregado a la audiencia Katalyst:",
          email
        );

        return NextResponse.json({
          success: true,
          message: "Record básico creado en Monday.com y MongoDB",
          needsValidation: true,
          userData: {
            email: email,
            personalMondayId: mondayId,
          },
        });
      } else {
        throw new Error("No se pudo crear el record básico en Monday.com");
      }
    }
  } catch (error) {
    console.error("Error en el registro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
