import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/app/models/User";
import { postMonday } from "@/libs/monday";

export async function POST(request) {
  try {
    const { email, ...userData } = await request.json();
    console.log("[complete-registration] Payload recibido:", {
      email,
      userData,
    });

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    // 1. Buscar usuario en MongoDB
    await connectDB();
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado en MongoDB" },
        { status: 404 }
      );
    }

    if (!existingUser.personalMondayId) {
      return NextResponse.json(
        { error: "Usuario no tiene personalMondayId" },
        { status: 400 }
      );
    }

    console.log("Usuario encontrado en MongoDB:", existingUser._id);
    console.log("Monday ID:", existingUser.personalMondayId);

    // 2. Actualizar el record en Monday.com con los datos completos
    const boardId = process.env.MONDAY_BOARD_ID;

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
    const columns = boardData.data.boards[0].columns;

    // Mapeo de campos a columnas de Monday
    const columnMap = {
      nombre: columns.find((col) => col.title === "Nombre")?.id,
      apellidoP: columns.find((col) => col.title === "Apellido Paterno")?.id,
      apellidoM: columns.find((col) => col.title === "Apellido Materno")?.id,
      fechaNacimiento: columns.find((col) => col.title === "Fecha Nacimiento")
        ?.id,
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

    if (columnMap.nombre && userData.firstName) {
      columnValuesObj[columnMap.nombre] = userData.firstName;
    }
    if (columnMap.apellidoP && userData.lastName) {
      columnValuesObj[columnMap.apellidoP] = userData.lastName;
    }
    if (columnMap.apellidoM && userData.secondLastName) {
      columnValuesObj[columnMap.apellidoM] = userData.secondLastName;
    }
    if (columnMap.fechaNacimiento && userData.dateOfBirth) {
      columnValuesObj[columnMap.fechaNacimiento] = {
        date: userData.dateOfBirth,
      };
    }
    if (columnMap.comunidad && userData.community) {
      columnValuesObj[columnMap.comunidad] = { label: userData.community };
    }
    if (columnMap.genero && userData.gender) {
      columnValuesObj[columnMap.genero] = { labels: [userData.gender] };
    }
    if (columnMap.foto && userData.fotoPerfil) {
      columnValuesObj[columnMap.foto] = userData.fotoPerfil;
    }
    if (columnMap.telefono && userData.phone) {
      columnValuesObj[columnMap.telefono] = {
        phone: userData.phone,
        countryShortName: userData.pais || "MX",
      };
    }

    // Actualizar el nombre del item
    const itemName =
      userData.name || `${userData.firstName} ${userData.lastName}`.trim();

    let columnValuesStr = JSON.stringify(columnValuesObj);
    columnValuesStr = columnValuesStr.replace(/"/g, '\\"');

    // Actualizar el item en Monday
    const mutation = {
      query: `mutation { 
        change_simple_column_value(item_id: ${
          existingUser.personalMondayId
        }, board_id: ${boardId}, column_id: "name", value: "${itemName.replace(
        /"/g,
        '\\"'
      )}") { id } 
      }`,
    };

    const nameUpdateResponse = await postMonday(mutation.query);
    console.log("Respuesta actualización nombre:", nameUpdateResponse);

    // Actualizar las columnas si hay datos
    if (Object.keys(columnValuesObj).length > 0) {
      const columnMutation = {
        query: `mutation { 
          change_multiple_column_values(item_id: ${existingUser.personalMondayId}, board_id: ${boardId}, column_values: "${columnValuesStr}", create_labels_if_missing: false) { id } 
        }`,
      };

      const columnUpdateResponse = await postMonday(columnMutation.query);
      console.log("Respuesta actualización columnas:", columnUpdateResponse);
    }

    // 3. Actualizar usuario en MongoDB con los datos completos
    const updateFields = {
      name: userData.name,
      firstName: userData.firstName,
      lastName: userData.lastName,
      secondLastName: userData.secondLastName,
      phone: userData.phone,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      community: userData.community,
      fotoPerfil: userData.fotoPerfil,
      updatedAt: new Date(),
    };

    // Solo incluir campos que no sean undefined
    Object.keys(updateFields).forEach((key) => {
      if (updateFields[key] === undefined) {
        delete updateFields[key];
      }
    });

    await User.findOneAndUpdate(
      { email },
      { $set: updateFields },
      { new: true }
    );

    console.log("[MongoDB] Usuario actualizado con datos completos");

    return NextResponse.json({
      success: true,
      message: "Registro completado exitosamente",
      personalMondayId: existingUser.personalMondayId,
    });
  } catch (error) {
    console.error("Error al completar registro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
