import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/User";
import { postMonday } from "@/libs/monday";
import { Resend } from "resend";
import config from "@/config";

export async function POST(request) {
  try {
    console.log("=== INICIO DEL PROCESO DE REGISTRO EN EL SERVIDOR ===");
    const formData = await request.formData();
    const userData = {
      nombre: formData.get("nombre"),
      apellidoPaterno: formData.get("apellidoPaterno"),
      apellidoMaterno: formData.get("apellidoMaterno"),
      telefono: formData.get("telefono"),
      fechaNacimiento: formData.get("fechaNacimiento"),
      comunidad: formData.get("comunidad"),
      genero: formData.get("genero"),
      email: formData.get("email"),
      // foto: formData.get("foto"), // Comentado temporalmente
    };

    console.log("Datos recibidos del formulario:", userData);

    // Verificar si el usuario ya existe
    console.log("Conectando a MongoDB...");
    await connectDB();
    console.log("Buscando usuario existente con email:", userData.email);
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log("Usuario ya existe en la base de datos:", existingUser);
      return NextResponse.json(
        { error: "El usuario ya está registrado" },
        { status: 400 }
      );
    }

    // 1. Obtener estructura del board
    console.log("Obteniendo estructura del board...");
    const boardQuery = `query {
      boards (ids: [${process.env.MONDAY_BOARD_ID}]) {
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
    console.log("Respuesta de estructura del board:", boardResponse);

    if (!boardResponse?.data?.boards?.[0]?.columns) {
      throw new Error("No se pudo obtener la estructura del board");
    }

    const columns = boardResponse.data.boards[0].columns;
    console.log("Columnas encontradas:", columns);

    // Encontrar los IDs de las columnas necesarias
    const columnIds = {
      nombre: columns.find((col) => col.title === "Nombre")?.id,
      apellidoPaterno: columns.find((col) => col.title === "Apellido Paterno")
        ?.id,
      apellidoMaterno: columns.find((col) => col.title === "Apellido Materno")
        ?.id,
      telefono: columns.find((col) => col.title === "Teléfono")?.id,
      fechaNacimiento: columns.find((col) => col.title === "Fecha Nacimiento")
        ?.id,
      comunidad: columns.find((col) => col.title === "Comunidad")?.id,
      genero: columns.find((col) => col.title === "Género")?.id,
      email: columns.find((col) => col.title === "Email")?.id,
      // imagen: columns.find(col => col.title === "Imagen")?.id // Comentado temporalmente
    };

    console.log("IDs de columnas encontrados:", columnIds);

    // 2. Crear nuevo item en Monday.com
    console.log("Creando nuevo item en Monday.com...");

    // Preparar los valores de las columnas
    const columnValues = {
      [columnIds.nombre]: { text: userData.nombre },
      [columnIds.apellidoPaterno]: { text: userData.apellidoPaterno },
      [columnIds.apellidoMaterno]: { text: userData.apellidoMaterno },
      [columnIds.telefono]: {
        phone: userData.telefono,
        countryShortName: "MX",
      },
      [columnIds.fechaNacimiento]: { date: userData.fechaNacimiento },
      [columnIds.comunidad]: { labels: [userData.comunidad] },
      [columnIds.genero]: { labels: [userData.genero] },
      [columnIds.email]: { email: userData.email, text: userData.email },
    };

    console.log("Valores de columnas preparados:", columnValues);

    const mondayMutation = `mutation {
      create_item (
        board_id: ${process.env.MONDAY_BOARD_ID},
        item_name: "${userData.nombre} ${userData.apellidoPaterno} ${
      userData.apellidoMaterno
    }",
        column_values: ${JSON.stringify(JSON.stringify(columnValues))}
      ) {
        id
      }
    }`;

    console.log("Mutation para Monday:", mondayMutation);

    const mondayResponse = await postMonday(mondayMutation);
    console.log("Respuesta de creación en Monday:", mondayResponse);

    if (!mondayResponse?.data?.create_item?.id) {
      console.error("Error: No se recibió ID de Monday");
      throw new Error("Error al crear el perfil en Monday.com");
    }

    const mondayId = mondayResponse.data.create_item.id;
    console.log("ID de Monday asignado:", mondayId);

    // 3. Crear usuario en la base de datos
    console.log("Creando usuario en MongoDB...");
    const user = await User.create({
      email: userData.email,
      name: `${userData.nombre} ${userData.apellidoPaterno} ${userData.apellidoMaterno}`,
      firstName: userData.nombre,
      lastName: userData.apellidoPaterno,
      secondLastName: userData.apellidoMaterno,
      personalMondayId: mondayId,
      // photoUrl: photoUrl, // Comentado temporalmente
    });

    console.log("Usuario creado en MongoDB:", user);

    // 4. Enviar correo de verificación
    console.log("Enviando correo de verificación...");
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      let baseUrl = "";
      if (process.env.NODE_ENV === "development") {
        baseUrl = "http://localhost:3000";
      } else {
        baseUrl = `https://${config.domainName}`;
      }

      const verificationUrl = `${baseUrl}/api/auth/signin?email=${encodeURIComponent(
        userData.email
      )}`;

      await resend.emails.send({
        from: config.resend.fromNoReply,
        to: userData.email,
        subject: "Verifica tu cuenta en Katalyst",
        html: `
          <div style="background:#f9fafb;padding:40px 0;min-height:100vh;font-family:sans-serif;">
            <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;padding:32px 24px;box-shadow:0 2px 8px #0001;">
              <h2 style="text-align:center;color:#222;font-size:24px;margin-bottom:24px;">¡Bienvenido a <span style='color:#FFA726'>Katalyst</span>!</h2>
              <p style="text-align:center;font-size:16px;color:#444;margin-bottom:32px;">Haz clic en el botón para verificar tu cuenta:</p>
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${verificationUrl}" style="display:inline-block;padding:16px 32px;background:#FFA726;color:#fff;font-size:18px;font-weight:bold;border-radius:8px;text-decoration:none;">Verificar cuenta</a>
              </div>
              <p style="text-align:center;font-size:14px;color:#888;">Si no solicitaste este acceso, puedes ignorar este correo.</p>
              <hr style="margin:32px 0;border:none;border-top:1px solid #eee;" />
              <p style="text-align:center;font-size:12px;color:#bbb;">&copy; ${new Date().getFullYear()} Katalyst</p>
            </div>
          </div>
        `,
      });
      console.log("Correo de verificación enviado exitosamente");
    } catch (error) {
      console.error("Error al enviar correo de verificación:", error);
    }

    console.log("=== FIN DEL PROCESO DE REGISTRO EN EL SERVIDOR ===");

    return NextResponse.json({
      message: "Usuario registrado exitosamente",
      user,
    });
  } catch (error) {
    console.error("=== ERROR EN EL PROCESO DE REGISTRO ===");
    console.error("Tipo de error:", error.name);
    console.error("Mensaje de error:", error.message);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      { error: "Error al registrar usuario" },
      { status: 500 }
    );
  }
}
