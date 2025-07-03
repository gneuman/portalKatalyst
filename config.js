import themes from "daisyui/src/theming/themes";

const config = {
  // REQUIRED
  appName: "Katalyst Dashboard",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription: "Plataforma de gestión de comunidades",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: process.env.NEXTAUTH_URL
    ? process.env.NEXTAUTH_URL.replace(/^https?:\/\//, "")
    : "katalyst.org.mx",
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file (resend.supportEmail) otherwise customer support won't work.
    id: "",
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on every routes, just remove this below
    onlyShowOnRoutes: ["/"],
  },
  stripe: {
    // Create multiple plans in your Stripe dashboard, then add them here. You can add as many plans as you want, just make sure to add the priceId
    plans: [
      {
        // REQUIRED — we use this to find the plan in the webhook (for instance if you want to update the user's credits based on the plan)
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1RTNkUGK5CjHnrQWDM6IxlOX"
            : "price_1RTNkUGK5CjHnrQWDM6IxlOX",
        //  REQUIRED - Name of the plan, displayed on the pricing page
        name: "Plan Mensual",
        // A friendly description of the plan, displayed on the pricing page. Tip: explain why this plan and not others
        description: "Acceso completo a todas las funcionalidades",
        // The price you want to display, the one user will be charged on Stripe.
        price: 3999,
        // If you have an anchor price (i.e. $29) that you want to display crossed out, put it here. Otherwise, leave it empty
        priceAnchor: 9999,
        // Tipo de suscripción
        interval: "month",
        features: [
          {
            name: "Miembros ilimitados",
          },
          { name: "Foros ilimitados" },
          { name: "Chat en vivo" },
          { name: "Eventos virtuales" },
          { name: "Analíticas avanzadas" },
          { name: "Soporte prioritario" },
        ],
      },
      {
        // This plan will look different on the pricing page, it will be highlighted. You can only have one plan with isFeatured: true
        isFeatured: true,
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1RTNkUGK5CjHnrQWDM6IxlOX"
            : "price_1RTNkUGK5CjHnrQWDM6IxlOX",
        name: "Plan Anual",
        description: "Ahorra 2 meses al pagar por adelantado",
        price: 9990,
        priceAnchor: 14990,
        // Tipo de suscripción
        interval: "year",
        features: [
          {
            name: "Miembros ilimitados",
          },
          { name: "Foros ilimitados" },
          { name: "Chat en vivo" },
          { name: "Eventos virtuales" },
          { name: "Analíticas avanzadas" },
          { name: "Soporte prioritario 24/7" },
        ],
      },
    ],
  },
  aws: {
    // If you use AWS S3/Cloudfront, put values in here
    bucket: "katalyst-assets",
    bucketUrl: `https://katalyst-assets.s3.amazonaws.com/`,
    cdn: "https://cdn.katalyst.org.mx/",
  },
  resend: {
    // REQUIRED — Email 'From' field to be used when sending magic login links
    fromNoReply: `Katalyst <onboarding@resend.dev>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `Soporte Katalyst <onboarding@resend.dev>`,
    // Email shown to customer if need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: "soporte@katalyst.org.mx",
  },
  colors: {
    theme: "katalyst",
    main: "#233746",
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/api/auth/signin",
    // REQUIRED — the path you want to redirect users after successfull login (i.e. /dashboard, /private). This is normally a private page for users to manage their accounts. It's used in apiClient (/libs/api.js) upon 401 errors from our API & in ButtonSignin.js
    callbackUrl: "/dashboard",
    providers: ["google", "github"],
    defaultProvider: "google",
  },
  api: {
    baseUrl: process.env.NEXTAUTH_URL + "/api" || "http://localhost:3000/api",
  },
  database: {
    type: "mongodb", // o "postgresql", "mysql", etc.
  },
  features: {
    enableAnalytics: true,
    enableNotifications: true,
    enableDarkMode: true,
  },
};

export default config;
