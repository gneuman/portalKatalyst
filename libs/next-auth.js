import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import config from "@/config";
import connectMongo from "./mongo";
import { postMonday } from "./monday";
import nodemailer from "nodemailer";

// Función para sincronizar datos de Monday.com con MongoDB (solo UPDATE, nunca CREATE)
async function syncWithMonday(email) {
  try {
    const UserModel = require("@/app/models/User").default;
    let dbUser = await UserModel.findOne({ email });
    if (!dbUser) {
      // Si no existe, no hacer nada (NextAuth lo creará automáticamente)
      return;
    }
    // Buscar en Monday.com por email
    const boardId = process.env.MONDAY_BOARD_ID;
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
    if (!emailColumn) return;
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
      const mondayItem = mondayItems[0];
      const columnValues = {};
      mondayItem.column_values.forEach((col) => {
        if (col.column?.type === "status") {
          columnValues[col.id] = col.value || "";
        } else {
          columnValues[col.id] = col.text || col.value || "";
        }
      });
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
    }
  } catch (error) {
    console.error("Error en sincronización con Monday.com:", error);
  }
}

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
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
    // Proveedor de credenciales para email/contraseña
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email y contraseña son requeridos");
          }

          const UserModel = require("@/app/models/User").default;

          // Buscar usuario con contraseña incluida
          const user = await UserModel.findByEmailWithPassword(
            credentials.email
          );

          if (!user) {
            throw new Error("Usuario no encontrado");
          }

          // Verificar si el usuario tiene contraseña configurada
          if (!user.hasPasswordSet()) {
            throw new Error(
              "Este usuario no tiene contraseña configurada. Usa el enlace mágico."
            );
          }

          // Comparar contraseñas
          const isPasswordValid = await user.comparePassword(
            credentials.password
          );

          if (!isPasswordValid) {
            throw new Error("Contraseña incorrecta");
          }

          // Actualizar último login
          user.lastLogin = new Date();
          await user.save();

          // Sincronizar con Monday.com
          await syncWithMonday(user.email);

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.fotoPerfil,
          };
        } catch (error) {
          console.error("Error en autenticación con credenciales:", error);
          throw error;
        }
      },
    }),
    // Email provider para magic links
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
            async sendVerificationRequest({ identifier, url, provider }) {
              console.log(
                "[NextAuth] Intentando enviar correo de verificación a:",
                identifier
              );
              console.log("[NextAuth] URL de verificación:", url);
              console.log("[NextAuth] From address:", provider.from);
              console.log(
                "[NextAuth] RESEND_API_KEY presente:",
                !!process.env.RESEND_API_KEY
              );

              try {
                // Usar la API de Resend directamente
                const { Resend } = await import("resend");
                const resend = new Resend(process.env.RESEND_API_KEY);

                console.log("[NextAuth] Resend client creado exitosamente");

                const result = await resend.emails.send({
                  from: provider.from,
                  to: identifier,
                  subject: `Tu acceso a Katalyst`,
                  text: `¡Bienvenido a Katalyst!\n\nHaz clic en el siguiente enlace para acceder a tu cuenta:\n${url}\n\nSi no solicitaste este acceso, puedes ignorar este correo.`,
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
                        <p style="text-align:center;font-size:12px;color:#bbb;">© ${new Date().getFullYear()} Katalyst</p>
                      </div>
                    </div>
                  `,
                });
                console.log("[NextAuth] Resultado de sendMail:", result);
                console.log("[NextAuth] Email enviado exitosamente");
              } catch (err) {
                console.error(
                  "[NextAuth] Error enviando correo de verificación:",
                  err
                );
                console.error("[NextAuth] Detalles del error:", {
                  message: err.message,
                  code: err.code,
                  statusCode: err.statusCode,
                  response: err.response,
                });
                throw err;
              }
            },
          }),
        ]
      : []),
  ],
  ...(connectMongo && { adapter: MongoDBAdapter(connectMongo) }),
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("[NextAuth] signIn callback ejecutado para:", user?.email);

      if (user?.email) {
        const UserModel = require("@/app/models/User").default;
        // Espera a que el usuario exista en MongoDB (máx 5 intentos)
        let dbUser = null;
        for (let i = 0; i < 5; i++) {
          dbUser = await UserModel.findOne({ email: user.email });
          if (dbUser) break;
          await new Promise((res) => setTimeout(res, 300)); // espera 300ms
        }

        if (dbUser) {
          await syncWithMonday(user.email); // solo actualiza, no crees

          // Verificar si el usuario necesita completar su perfil
          if (
            !dbUser.name ||
            dbUser.name === user.email ||
            dbUser.name === "Usuario NoCode" ||
            !dbUser.firstName ||
            !dbUser.lastName
          ) {
            console.log(
              "[NextAuth] Usuario necesita completar perfil, redirigiendo..."
            );
            // Redirigir a completar perfil en lugar del dashboard
            return `/register/complete-profile?email=${encodeURIComponent(
              user.email
            )}`;
          }
        } else {
          console.log(
            "[NextAuth] Usuario no encontrado en DB, será nuevo usuario"
          );
          // Para usuarios nuevos, redirigir a completar perfil
          return `/register/complete-profile?email=${encodeURIComponent(
            user.email
          )}`;
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log("[NextAuth] redirect callback:", { url, baseUrl });

      // Si la URL contiene callbackUrl, extraer el email y verificar el estado del perfil
      if (url.includes("callbackUrl")) {
        try {
          const urlObj = new URL(url);
          const email = urlObj.searchParams.get("email");

          if (email) {
            console.log("[NextAuth] Email detectado en redirect:", email);

            // Verificar el estado del perfil del usuario
            const UserModel = require("@/app/models/User").default;
            const dbUser = await UserModel.findOne({ email });

            if (dbUser) {
              // Verificar si el usuario necesita completar su perfil
              if (
                !dbUser.name ||
                dbUser.name === email ||
                dbUser.name === "Usuario NoCode" ||
                !dbUser.firstName ||
                !dbUser.lastName
              ) {
                console.log(
                  "[NextAuth] Usuario necesita completar perfil, redirigiendo..."
                );
                return `${baseUrl}/register/complete-profile?email=${encodeURIComponent(
                  email
                )}`;
              }
            }
          }
        } catch (error) {
          console.error("[NextAuth] Error en redirect callback:", error);
        }
      }

      // Si la URL es relativa, agregar la base URL
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      // Si la URL es del mismo dominio, permitir
      if (new URL(url).origin === baseUrl) {
        return url;
      }

      // Por defecto, ir al dashboard
      return `${baseUrl}/dashboard`;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub;
        const UserModel = require("@/app/models/User").default;
        try {
          if (session?.user?.email) {
            const dbUser = await UserModel.findOne({
              email: session.user.email,
            }).lean();
            if (dbUser) {
              session.user = {
                id: dbUser._id,
                name: dbUser.name,
                email: dbUser.email,
                image: dbUser.image || dbUser.fotoPerfil,
                role: dbUser.role,
                personalMondayId: dbUser.personalMondayId,
                businessMondayId: dbUser.businessMondayId,
                fotoPerfil: dbUser.fotoPerfil,
                firstName: dbUser?.firstName || null,
                lastName: dbUser?.lastName || null,
                secondLastName: dbUser?.secondLastName || null,
                comunidad: dbUser?.comunidad || dbUser?.community || null,
                phone: dbUser?.phone || null,
                dateOfBirth: dbUser?.dateOfBirth || null,
                gender: dbUser?.gender || null,
                hasPassword: dbUser?.hasPassword || false,
              };
            }
          }
        } catch (error) {
          console.error("Error al buscar usuario en DB:", error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/api/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/api/auth/signin",
    newUser: "/register/complete-profile",
  },
  session: {
    strategy: "jwt",
    maxAge: 90 * 24 * 60 * 60,
  },
  theme: {
    brandColor: config.colors.main,
    logo: `https://${config.domainName}/logoAndName.png`,
  },
};
