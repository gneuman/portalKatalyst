import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import config from "@/config";
import connectMongo from "./mongo";
import nodemailer from "nodemailer";
import { postMonday } from "./monday";

// Configuración del adaptador de MongoDB
const adapter = connectMongo ? MongoDBAdapter(connectMongo) : null;

export const authOptions = {
  // Set any random key in .env.local
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      // Follow the "Login with Google" tutorial to get your credentials
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      async profile(profile) {
        return {
          id: profile.sub,
          name: profile.given_name ? profile.given_name : profile.name,
          email: profile.email,
          image: profile.picture,
          createdAt: new Date(),
        };
      },
    }),
    // Follow the "Login with Email" tutorial to set up your email server
    // Requires a MongoDB database. Set MONOGODB_URI env variable.
    ...(connectMongo
      ? [
          EmailProvider({
            server: {
              host: "smtp.resend.com",
              port: 465,
              secure: true,
              auth: {
                user: "resend",
                pass: process.env.RESEND_API_KEY,
              },
            },
            from: config.resend.fromNoReply,
            // Personalización del correo de acceso
            async sendVerificationRequest({ identifier, url, provider }) {
              console.log("=== SINCRONIZACIÓN ANTES DE ENVIAR CORREO ===");
              console.log("Enviando correo de verificación a:", identifier);
              console.log("URL de verificación:", url);

              // SINCRONIZAR CON MONDAY.COM ANTES DE ENVIAR EL CORREO
              await syncWithMonday(identifier);

              // Asegurarnos de que el token se guarde en la base de datos
              if (adapter) {
                try {
                  const token = url.split("token=")[1].split("&")[0];
                  console.log("Token generado:", token);

                  // Guardar el token en la base de datos
                  await adapter.createVerificationToken({
                    identifier,
                    token,
                    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
                  });
                  console.log("Token guardado en la base de datos");
                } catch (error) {
                  console.error("Error al guardar el token:", error);
                }
              }

              const { host } = new URL(url);
              const transport = nodemailer.createTransport(provider.server);
              await transport.sendMail({
                to: identifier,
                from: provider.from,
                subject: `Tu acceso a Katalyst`,
                text: `Accede a tu cuenta de Katalyst\n\nHaz clic en el siguiente enlace para iniciar sesión:\n${url}\n\nSi no solicitaste este acceso, puedes ignorar este correo.`,
                html: `
                  <div style="background:#f9fafb;padding:40px 0;min-height:100vh;font-family:sans-serif;">
                    <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;padding:32px 24px;box-shadow:0 2px 8px #0001;">
                      <h2 style="text-align:center;color:#222;font-size:24px;margin-bottom:24px;">¡Bienvenido a <span style='color:#FFA726'>Katalyst</span>!</h2>
                      <p style="text-align:center;font-size:16px;color:#444;margin-bottom:32px;">Haz clic en el botón para acceder a tu cuenta:</p>
                      <div style="text-align:center;margin-bottom:32px;">
                        <a href="${url}" style="display:inline-block;padding:16px 32px;background:#FFA726;color:#fff;font-size:18px;font-weight:bold;border-radius:8px;text-decoration:none;">Acceder a Katalyst</a>
                      </div>
                      <p style="text-align:center;font-size:14px;color:#888;">Si no solicitaste este acceso, puedes ignorar este correo.</p>
                      <hr style="margin:32px 0;border:none;border-top:1px solid #eee;" />
                      <p style="text-align:center;font-size:12px;color:#bbb;">&copy; ${new Date().getFullYear()} Katalyst</p>
                    </div>
                  </div>
                `,
              });
              console.log("Correo enviado exitosamente");
            },
          }),
        ]
      : []),
  ],
  // New users will be saved in Database (MongoDB Atlas). Each user (model) has some fields like name, email, image, etc..
  // Requires a MongoDB database. Set MONOGODB_URI env variable.
  // Learn more about the model type: https://next-auth.js.org/v3/adapters/models
  adapter,

  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log("=== CALLBACK SIGNIN ===");
      console.log("Usuario autenticado:", user.email);

      // SINCRONIZAR CON MONDAY.COM EN CADA AUTENTICACIÓN
      await syncWithMonday(user.email);

      return true;
    },

    async session({ session, token }) {
      // Eliminado el forzado de sesión en desarrollo
      console.log("Session callback - Token:", token);
      console.log("Session callback - Session:", session);

      if (session?.user) {
        session.user.id = token.sub;
        // Buscar el usuario en la base de datos para obtener el campo 'instances'
        const UserModel = require("@/models/User").default;
        try {
          let dbUser = null;
          if (session?.user?.email) {
            console.log("Buscando usuario en DB:", session.user.email);
            dbUser = await UserModel.findOne({
              email: session.user.email,
            }).lean();
            console.log("Usuario encontrado en DB:", dbUser);
          }
          session.user = {
            id: dbUser._id,
            name: dbUser.name,
            email: dbUser.email,
            image: dbUser.image,
            role: dbUser.role,
            personalMondayId: dbUser.personalMondayId,
            businessMondayId: dbUser.businessMondayId,
          };
          // Agregar campos extendidos
          session.user.name = dbUser?.name || null;
          session.user.firstName = dbUser?.firstName || null;
          session.user.lastName = dbUser?.lastName || null;
          session.user.secondLastName = dbUser?.secondLastName || null;
          // Puedes agregar más campos si los necesitas
        } catch (error) {
          console.error("Error al buscar usuario en DB:", error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/api/auth/signin",
    verifyRequest: "/api/auth/verify-request",
    error: "/api/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 90 * 24 * 60 * 60, // 90 días
  },
  debug: true, // Habilitar logs de debug
  theme: {
    brandColor: config.colors.main,
    // Add you own logo below. Recommended size is rectangle (i.e. 200x50px) and show your logo + name.
    // It will be used in the login flow to display your logo. If you don't add it, it will look faded.
    logo: `https://${config.domainName}/logoAndName.png`,
  },
};

// Función principal de sincronización con Monday.com
async function syncWithMonday(email) {
  try {
    console.log("=== SINCRONIZANDO CON MONDAY.COM ===");
    console.log("Email:", email);

    // Buscar usuario en MongoDB
    const UserModel = require("@/models/User").default;
    let dbUser = await UserModel.findOne({ email });

    if (!dbUser) {
      console.log("Usuario no encontrado en MongoDB, creando básico");
      // Crear usuario básico en MongoDB
      dbUser = await UserModel.create({
        email,
        name: email,
        emailVerified: new Date(),
        businessMondayId: [],
        validado: false,
        updatedAt: new Date(),
      });
      console.log("Usuario básico creado en MongoDB:", dbUser._id);
    }

    // Buscar en Monday.com por email
    const boardId = process.env.MONDAY_BOARD_ID;
    console.log("Buscando en Monday.com por email:", email);

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
      return;
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
            column_values {
              id
              text
              value
              column {
                id
                title
              }
            }
          }
        }
      }
    `;

    const mondayData = await postMonday(searchQuery);
    const mondayItems =
      mondayData?.data?.items_page_by_column_values?.items || [];

    if (mondayItems.length > 0) {
      // USUARIO ENCONTRADO EN MONDAY.COM
      console.log("Usuario encontrado en Monday.com, actualizando datos");
      const mondayItem = mondayItems[0];

      // Extraer datos de Monday.com
      const columnValues = {};
      mondayItem.column_values.forEach((col) => {
        columnValues[col.id] = col.text || col.value || "";
      });

      // Mapear columnas
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

      // Actualizar usuario en MongoDB con datos de Monday
      const updateFields = {
        personalMondayId: mondayItem.id,
        name: mondayItem.name,
        firstName: nombreCol
          ? columnValues[nombreCol]
          : mondayItem.name.split(" ")[0] || "",
        lastName: apellidoPCol
          ? columnValues[apellidoPCol]
          : mondayItem.name.split(" ").slice(1).join(" ") || "",
        secondLastName: apellidoMCol ? columnValues[apellidoMCol] : "",
        phone: telefonoCol ? columnValues[telefonoCol] : "",
        dateOfBirth: fechaCol ? columnValues[fechaCol] : "",
        gender: generoCol ? columnValues[generoCol] : "",
        community: comunidadCol ? columnValues[comunidadCol] : "",
        fotoPerfil: fotoCol ? columnValues[fotoCol] : "",
        lastLogin: new Date(),
        updatedAt: new Date(),
      };

      // Solo incluir campos que no sean undefined o vacíos
      Object.keys(updateFields).forEach((key) => {
        if (updateFields[key] === undefined || updateFields[key] === "") {
          delete updateFields[key];
        }
      });

      await UserModel.findOneAndUpdate(
        { email },
        { $set: updateFields },
        { new: true }
      );
      console.log("Usuario actualizado con datos de Monday.com");
    } else {
      // USUARIO NO ENCONTRADO EN MONDAY.COM, CREAR RECORD
      console.log("Usuario no encontrado en Monday.com, creando record");
      await createMondayRecord(email, dbUser);
    }
  } catch (error) {
    console.error("Error en sincronización con Monday.com:", error);
  }
}

// Función auxiliar para crear record en Monday.com
async function createMondayRecord(email, dbUser) {
  try {
    console.log("Creando record en Monday.com para:", email);

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
    const emailColumn = boardData.data.boards[0].columns.find(
      (col) => col.title.toLowerCase() === "email"
    );

    if (!emailColumn) {
      console.error("No se encontró la columna Email en el tablero");
      return;
    }

    // Crear record básico en Monday.com
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
      console.log("Record creado en Monday.com:", mondayId);

      // Actualizar personalMondayId en MongoDB
      const UserModel = require("@/models/User").default;
      await UserModel.findOneAndUpdate(
        { email: email },
        {
          $set: {
            personalMondayId: mondayId,
            lastLogin: new Date(),
            updatedAt: new Date(),
          },
        },
        { new: true }
      );
      console.log("personalMondayId actualizado en MongoDB");
    }
  } catch (error) {
    console.error("Error al crear record en Monday.com:", error);
  }
}
