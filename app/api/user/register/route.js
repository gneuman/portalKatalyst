import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/User";
import { postMonday } from "@/libs/monday";

export async function POST(request) {
  try {
    console.log("=== INICIO DEL PROCESO DE REGISTRO ===");
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
      foto: formData.get("foto"),
    };

    console.log("Datos recibidos:", userData);

    // Verificar si el usuario ya existe
    await connectDB();
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log("Usuario ya existe en la base de datos");
      return NextResponse.json(
        { error: "El usuario ya está registrado" },
        { status: 400 }
      );
    }

    // 1. Subir foto a Monday.com si existe
    let mondayPhotoId = null;
    let photoUrl = null;
    if (userData.foto) {
      console.log("Subiendo foto a Monday.com...");
      const photoResponse = await postMonday(`mutation ($file: File!) {
        add_file_to_column (
          file: $file,
          column_id: "image",
          item_id: null
        ) {
          id
          url
        }
      }`);
      console.log("Respuesta de subida de foto:", photoResponse);
      mondayPhotoId = photoResponse?.data?.add_file_to_column?.id;
      photoUrl = photoResponse?.data?.add_file_to_column?.url;
    }

    // 2. Crear nuevo item en Monday.com
    console.log("Creando nuevo item en Monday.com...");
    const mondayResponse = await postMonday(`mutation {
      create_item (
        board_id: ${process.env.MONDAY_BOARD_ID},
        item_name: "${userData.nombre} ${userData.apellidoPaterno} ${
      userData.apellidoMaterno
    }",
        column_values: ${JSON.stringify(
          JSON.stringify({
            text: userData.nombre,
            text7: userData.apellidoPaterno,
            text8: userData.apellidoMaterno,
            phone: userData.telefono,
            date4: userData.fechaNacimiento,
            dropdown: userData.comunidad,
            dropdown7: userData.genero,
            email: { email: userData.email, text: userData.email },
            image: mondayPhotoId ? { item_ids: [mondayPhotoId] } : null,
          })
        )}
      ) {
        id
      }
    }`);

    console.log("Respuesta de creación en Monday:", mondayResponse);

    if (!mondayResponse?.data?.create_item?.id) {
      throw new Error("Error al crear el perfil en Monday.com");
    }

    // 3. Crear usuario en la base de datos
    console.log("Creando usuario en la base de datos...");
    const user = await User.create({
      email: userData.email,
      name: `${userData.nombre} ${userData.apellidoPaterno} ${userData.apellidoMaterno}`,
      firstName: userData.nombre,
      lastName: userData.apellidoPaterno,
      secondLastName: userData.apellidoMaterno,
      personalMondayId: mondayResponse.data.create_item.id,
      photoUrl: photoUrl,
    });

    console.log("Usuario creado en la base de datos:", user);

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
