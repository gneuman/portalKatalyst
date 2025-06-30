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

    // 2. SIEMPRE BUSCAR EN MONDAY.COM PARA OBTENER/ACTUALIZAR MONDAY ID
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

      // Verificar si tiene nombre completo
      const tieneNombre =
        nombreCol &&
        columnValues[nombreCol] &&
        columnValues[nombreCol].trim() !== "";
      const tieneApellido =
        apellidoPCol &&
        columnValues[apellidoPCol] &&
        columnValues[apellidoPCol].trim() !== "";

      // Preparar datos para MongoDB
      const mongoData = {
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

      if (existingUser) {
        // 3.1 SI EXISTE EN MONGODB, ACTUALIZAR CON DATOS DE MONDAY
        console.log(
          "Usuario existe en MongoDB, actualizando con datos de Monday"
        );

        // Actualizar solo los campos que vienen de Monday
        const updateFields = {
          personalMondayId: mongoData.personalMondayId,
          name: mongoData.name,
          firstName: mongoData.firstName,
          lastName: mongoData.lastName,
          secondLastName: mongoData.secondLastName,
          phone: mongoData.phone,
          dateOfBirth: mongoData.dateOfBirth,
          gender: mongoData.gender,
          community: mongoData.community,
          fotoPerfil: mongoData.fotoPerfil,
          updatedAt: new Date(),
        };

        // Solo incluir campos que no sean undefined o vacíos
        Object.keys(updateFields).forEach((key) => {
          if (updateFields[key] === undefined || updateFields[key] === "") {
            delete updateFields[key];
          }
        });

        await User.findOneAndUpdate(
          { email },
          { $set: updateFields },
          { new: true }
        );
        console.log(
          "[MongoDB] Usuario actualizado con datos de Monday:",
          existingUser._id
        );
      } else {
        // 3.2 SI NO EXISTE EN MONGODB, CREAR NUEVO USUARIO
        console.log("Usuario no existe en MongoDB, creando nuevo");
        await User.create(mongoData);
        console.log(
          "[MongoDB] Usuario creado con datos de Monday:",
          mongoData._id
        );
      }

      // Enviar correo
      await resend.contacts.create({
        email: email,
        firstName: mongoData.firstName,
        lastName: mongoData.lastName,
        unsubscribed: false,
        audienceId: RESEND_AUDIENCE_ID,
      });
      console.log("[Resend] Contacto agregado a la audiencia Katalyst:", email);

      // Si no tiene nombre completo, redirigir a dashboard/profile
      if (!tieneNombre || !tieneApellido) {
        return NextResponse.json({
          redirect: `/dashboard/profile?email=${encodeURIComponent(email)}`,
          message:
            "Usuario encontrado en Monday pero necesita completar perfil",
        });
      }

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

        // Preparar datos básicos para MongoDB
        const basicData = {
          email,
          name: email,
          personalMondayId: mondayId,
          emailVerified: new Date(),
          businessMondayId: [],
          validado: false,
          updatedAt: new Date(),
        };

        if (existingUser) {
          // 3.3 SI EXISTE EN MONGODB, ACTUALIZAR SOLO EL MONDAY ID
          console.log("Usuario existe en MongoDB, actualizando Monday ID");
          await User.findOneAndUpdate(
            { email },
            {
              $set: {
                personalMondayId: mondayId,
                updatedAt: new Date(),
              },
            },
            { new: true }
          );
          console.log(
            "[MongoDB] Usuario actualizado con Monday ID:",
            existingUser._id
          );
        } else {
          // 3.4 SI NO EXISTE EN MONGODB, CREAR USUARIO BÁSICO
          console.log("Usuario no existe en MongoDB, creando básico");
          await User.create(basicData);
          console.log("[MongoDB] Usuario básico creado:", basicData._id);
        }

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
          redirect: `/dashboard/profile?email=${encodeURIComponent(email)}`,
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
