import { NextResponse } from "next/server";
import { postMonday } from "@/libs/monday";

export async function POST(request) {
  try {
    const data = await request.json();
    console.log("[create-monday-user] Payload recibido:", data);

    // Normalizar la fecha de nacimiento a YYYY-MM-DD (asegurar antes de validación)
    let fechaNacRaw = data.date || data.fechaNacimiento;
    // Buscar en cualquier campo un objeto { date: ... }
    if (!fechaNacRaw) {
      for (const key in data) {
        if (
          data[key] &&
          typeof data[key] === "object" &&
          "date" in data[key] &&
          typeof data[key].date === "string"
        ) {
          fechaNacRaw = data[key].date;
          break;
        }
      }
    }
    let fechaNac = undefined;
    if (fechaNacRaw) {
      if (typeof fechaNacRaw === "string") {
        // Si viene en formato DD/MM/YYYY lo convertimos
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaNacRaw)) {
          const [d, m, y] = fechaNacRaw.split("/");
          fechaNac = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(fechaNacRaw)) {
          fechaNac = fechaNacRaw;
        } else {
          // Intentar parsear cualquier otro string
          try {
            fechaNac = new Date(fechaNacRaw).toISOString().split("T")[0];
          } catch {
            fechaNac = undefined;
          }
        }
      } else if (fechaNacRaw instanceof Date) {
        fechaNac = fechaNacRaw.toISOString().split("T")[0];
      }
    }

    // Normalizar la URL de la foto
    const fotoUrl = data.foto || data.fotoPerfil || data.fotoUrl || undefined;

    // Normalizar los datos
    const normalizedData = {
      name: data.name,
      nombre: data.text_mkqc3cea || data.nombre,
      apellidoP: data.text_mkqcmqh0 || data.apellidoP,
      apellidoM: data.text_mkqcjqph || data.apellidoM,
      genero: data.dropdown_mkqkh24j?.labels?.[0] || data.genero,
      comunidad: data.status || data.comunidad,
      telefono: data.phone_mkqcqejx || data.telefono,
      email: data.email_mkqcc0tb || data.email,
      pais: data.pais || "MX",
      fechaNacimiento: fechaNac,
    };

    console.log("[create-monday-user] Datos normalizados:", normalizedData);

    // Validar email específicamente
    if (!normalizedData.email || !normalizedData.email.includes("@")) {
      console.error("[create-monday-user] Email inválido o faltante");
      return NextResponse.json(
        {
          error: "El email es requerido y debe ser válido",
          received: normalizedData,
        },
        { status: 400 }
      );
    }

    // Lista de campos requeridos (sin foto, ya que puede venir después)
    const requiredFields = [
      "name",
      "nombre",
      "apellidoP",
      "apellidoM",
      "fechaNacimiento",
      "genero",
      "comunidad",
      "telefono",
      "email",
    ];

    // Validación de campos requeridos
    const missing = requiredFields.filter((field) => !normalizedData[field]);
    if (missing.length > 0) {
      console.error("[create-monday-user] Faltan campos:", missing);
      return NextResponse.json(
        {
          error:
            "Faltan campos requeridos para crear el contacto en Monday.com",
          missingFields: missing,
          received: normalizedData,
        },
        { status: 400 }
      );
    }

    // Validar fecha de nacimiento
    if (normalizedData.fechaNacimiento) {
      try {
        // Intentar parsear la fecha para asegurar que es válida
        new Date(normalizedData.fechaNacimiento);
      } catch (error) {
        console.error(
          "[create-monday-user] Fecha de nacimiento inválida:",
          normalizedData.fechaNacimiento
        );
        return NextResponse.json(
          {
            error: "La fecha de nacimiento debe ser válida",
            received: normalizedData,
          },
          { status: 400 }
        );
      }
    }

    // Obtener la estructura del board
    const boardId = process.env.MONDAY_BOARD_ID;
    const query = `query { 
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

    const boardResponse = await postMonday(query);
    console.log("[create-monday-user] Estructura del board:", boardResponse);

    if (!boardResponse.data?.boards?.[0]?.columns) {
      throw new Error("No se pudo obtener la estructura del board");
    }

    const columns = boardResponse.data.boards[0].columns;
    console.log(
      "[create-monday-user] Columnas encontradas:",
      columns.map((c) => ({ id: c.id, title: c.title }))
    );

    // Mapeo de campos del frontend a columnas de Monday
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

    console.log("[create-monday-user] Mapeo de columnas:", columnMap);

    // Verificar que tenemos el ID de la columna de email
    if (!columnMap.email) {
      console.error(
        "[create-monday-user] No se encontró la columna de email en Monday"
      );
      return NextResponse.json(
        {
          error:
            "Error de configuración: No se encontró la columna de email en Monday",
          columnMap,
        },
        { status: 500 }
      );
    }

    // Comunidad: buscar el índice del label seleccionado
    let comunidadIndex = null;
    const colComunidad = columns.find(
      (col) => col.title === "Comunidad" && col.type === "status"
    );
    if (colComunidad && colComunidad.settings_str && normalizedData.comunidad) {
      const comunidadLabels =
        JSON.parse(colComunidad.settings_str).labels || {};
      comunidadIndex = Object.entries(comunidadLabels).find(
        ([, label]) => label === normalizedData.comunidad
      )?.[0];
      if (comunidadIndex !== undefined)
        comunidadIndex = parseInt(comunidadIndex);
      else comunidadIndex = null;
    }

    // Género: buscar el label y el id correcto
    let generoLabel = null;
    let generoId = null;
    const colGenero = columns.find(
      (col) => col.title === "Género" && col.type === "dropdown"
    );
    if (colGenero && colGenero.settings_str && normalizedData.genero) {
      const generoLabels = JSON.parse(colGenero.settings_str).labels || {};
      const found = Object.entries(generoLabels).find(
        ([, label]) => label === normalizedData.genero
      );
      if (found) {
        generoLabel = found[1];
        generoId = parseInt(found[0]);
      }
    }

    // Construir el objeto de valores para Monday
    const columnValuesObj = {};

    // Mapear cada campo con su valor correspondiente
    if (columnMap.nombre)
      columnValuesObj[columnMap.nombre] = normalizedData.nombre;
    if (columnMap.apellidoP)
      columnValuesObj[columnMap.apellidoP] = normalizedData.apellidoP;
    if (columnMap.apellidoM)
      columnValuesObj[columnMap.apellidoM] = normalizedData.apellidoM;
    if (columnMap.fechaNacimiento && normalizedData.fechaNacimiento)
      columnValuesObj[columnMap.fechaNacimiento] = {
        date: normalizedData.fechaNacimiento,
      };
    if (columnMap.comunidad && comunidadIndex !== null)
      columnValuesObj[columnMap.comunidad] = { index: comunidadIndex };
    // Asegurar que el género siempre se envíe, aunque no tenga ID
    if (columnMap.genero) {
      if (generoLabel && generoId !== null) {
        columnValuesObj[columnMap.genero] = {
          labels: [generoLabel],
          ids: [generoId],
        };
      } else if (normalizedData.genero) {
        columnValuesObj[columnMap.genero] = { labels: [normalizedData.genero] };
      }
    }
    if (columnMap.foto && fotoUrl) columnValuesObj[columnMap.foto] = fotoUrl;

    // Asegurar que el email se envíe correctamente
    columnValuesObj[columnMap.email] = {
      text: normalizedData.email,
      email: normalizedData.email,
    };

    if (columnMap.telefono)
      columnValuesObj[columnMap.telefono] = {
        phone: normalizedData.telefono,
        countryShortName: normalizedData.pais || "MX",
      };

    // Eliminar campos undefined o null
    Object.keys(columnValuesObj).forEach(
      (key) =>
        (columnValuesObj[key] === undefined || columnValuesObj[key] === null) &&
        delete columnValuesObj[key]
    );

    console.log("[create-monday-user] Datos a enviar a Monday:", {
      columnValuesObj,
      normalizedData,
      columnMap,
    });

    let columnValuesStr = JSON.stringify(columnValuesObj);
    columnValuesStr = columnValuesStr.replace(/"/g, '\\"');

    // Construir la mutación
    const mutation = {
      query: `mutation { create_item (board_id: ${boardId}, group_id: \"group_mkqkvhv4\", item_name: \"${normalizedData.name}\", column_values: \"${columnValuesStr}\", create_labels_if_missing: false) { id } }`,
    };
    console.log("[create-monday-user] Mutación completa:", mutation);

    // Llamada a la API de Monday.com
    const response = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.MONDAY_API_KEY,
      },
      body: JSON.stringify(mutation),
    });

    const result = await response.json();
    console.log("[create-monday-user] Respuesta de Monday:", result);

    if (!response.ok || result.errors) {
      return NextResponse.json(
        {
          error:
            result.errors?.[0]?.message ||
            "Error al crear usuario en Monday.com",
          details: result,
          mutation,
          received: normalizedData,
        },
        { status: 500 }
      );
    }

    // Responder con todos los datos relevantes para MongoDB
    return NextResponse.json({
      mondayId: result.data.create_item.id,
      success: true,
      mutation,
      received: normalizedData,
      mondayResponse: result,
      // Campos útiles para MongoDB:
      ...normalizedData,
      email: normalizedData.email, // Asegurar que el email se incluya explícitamente
      fotoPerfil: normalizedData.foto || "",
    });
  } catch (error) {
    console.error("[create-monday-user] Error general:", error);
    return NextResponse.json(
      {
        error: error.message || "Error inesperado en create-monday-user",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
