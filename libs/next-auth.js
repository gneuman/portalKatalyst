import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import config from "@/config";
import connectMongo from "./mongo";
import nodemailer from "nodemailer";

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
              auth: {
                user: "resend",
                pass: process.env.RESEND_API_KEY,
              },
            },
            from: config.resend.fromNoReply,
            // Personalización del correo de acceso
            async sendVerificationRequest({ identifier, url, provider }) {
              const { host } = new URL(url);
              const transport = nodemailer.createTransport(provider.server);
              await transport.sendMail({
                to: identifier,
                from: provider.from,
                subject: `Tu acceso a Muegano`,
                text: `Accede a tu cuenta de Muegano\n\nHaz clic en el siguiente enlace para iniciar sesión:\n${url}\n\nSi no solicitaste este acceso, puedes ignorar este correo.`,
                html: `
                  <div style="background:#f9fafb;padding:40px 0;min-height:100vh;font-family:sans-serif;">
                    <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;padding:32px 24px;box-shadow:0 2px 8px #0001;">
                      <h2 style="text-align:center;color:#222;font-size:24px;margin-bottom:24px;">¡Bienvenido a <span style='color:#2563eb'>Muegano</span>!</h2>
                      <p style="text-align:center;font-size:16px;color:#444;margin-bottom:32px;">Haz clic en el botón para acceder a tu cuenta:</p>
                      <div style="text-align:center;margin-bottom:32px;">
                        <a href="${url}" style="display:inline-block;padding:16px 32px;background:#2563eb;color:#fff;font-size:18px;font-weight:bold;border-radius:8px;text-decoration:none;">Acceder a Muegano</a>
                      </div>
                      <p style="text-align:center;font-size:14px;color:#888;">Si no solicitaste este acceso, puedes ignorar este correo.</p>
                      <hr style="margin:32px 0;border:none;border-top:1px solid #eee;" />
                      <p style="text-align:center;font-size:12px;color:#bbb;">&copy; ${new Date().getFullYear()} Muegano</p>
                    </div>
                  </div>
                `,
              });
            },
          }),
        ]
      : []),
  ],
  // New users will be saved in Database (MongoDB Atlas). Each user (model) has some fields like name, email, image, etc..
  // Requires a MongoDB database. Set MONOGODB_URI env variable.
  // Learn more about the model type: https://next-auth.js.org/v3/adapters/models
  ...(connectMongo && { adapter: MongoDBAdapter(connectMongo) }),

  callbacks: {
    session: async ({ session, token, user }) => {
      // Buscar el usuario en la base de datos para obtener el campo 'instances'
      const UserModel = require("@/models/User").default;
      let dbUser = null;
      if (session?.user?.email) {
        dbUser = await UserModel.findOne({ email: session.user.email }).lean();
      }
      if (session?.user) {
        session.user.id = token.sub;
        session.user.instances = dbUser?.instances || [];
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  theme: {
    brandColor: config.colors.main,
    // Add you own logo below. Recommended size is rectangle (i.e. 200x50px) and show your logo + name.
    // It will be used in the login flow to display your logo. If you don't add it, it will look faded.
    logo: `https://${config.domainName}/logoAndName.png`,
  },
};
