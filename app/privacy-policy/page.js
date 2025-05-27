import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

// CHATGPT PROMPT TO GENERATE YOUR PRIVACY POLICY — replace with your own data 👇

// 1. Go to https://chat.openai.com/
// 2. Copy paste bellow
// 3. Replace the data with your own (if needed)
// 4. Paste the answer from ChatGPT directly in the <pre> tag below

// You are an excellent lawyer.

// I need your help to write a simple privacy policy for my website. Here is some context:
// - Website: https://shipfa.st
// - Name: Muegano
// - Description: A JavaScript code boilerplate to help entrepreneurs launch their startups faster
// - User data collected: name, email and payment information
// - Non-personal data collection: web cookies
// - Purpose of Data Collection: Order processing
// - Data sharing: we do not share the data with any other parties
// - Children's Privacy: we do not collect any data from children
// - Updates to the Privacy Policy: users will be updated by email
// - Contact information: marc@shipfa.st

// Please write a simple privacy policy for my site. Add the current date.  Do not add or explain your reasoning. Answer:

export const metadata = getSEOTags({
  title: `Privacy Policy | ${config.appName}`,
  canonicalUrlRelative: "/privacy-policy",
});

const PrivacyPolicy = () => {
  return (
    <main className="max-w-xl mx-auto">
      <div className="p-5">
        <Link href="/" className="btn btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>{" "}
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          Privacy Policy for {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Last Updated: 2023-08-25

Gracias por visitar Muegano ("nosotros"). Esta Política de Privacidad describe cómo recopilamos, usamos y protegemos tu información personal y no personal cuando usas nuestro sitio web ubicado en https://muegano.net (el "Sitio Web").

Al acceder o usar el Sitio Web, aceptas los términos de esta Política de Privacidad. Si no estás de acuerdo con las prácticas descritas en esta política, por favor no uses el Sitio Web.

1. Información que recopilamos

1.1 Datos personales

Recopilamos la siguiente información personal de ti:

Nombre: Recopilamos tu nombre para personalizar tu experiencia y comunicarte efectivamente.
Correo electrónico: Recopilamos tu dirección de correo electrónico para enviarte información importante relacionada con tus pedidos, actualizaciones y comunicación.
Información de pago: Recopilamos detalles de pago para procesar pedidos de manera segura. Sin embargo, no almacenamos la información de pago en nuestros servidores. Los pagos se procesan mediante procesadores de pago de terceros de confianza.

1.2 Datos no personales

Podemos usar cookies web y tecnologías similares para recopilar información no personal como tu dirección IP, tipo de navegador, información del dispositivo y patrones de navegación. Esta información nos ayuda a mejorar tu experiencia de navegación, analizar tendencias y mejorar nuestros servicios.

2. Propósito de la recopilación de datos

Recopilamos y utilizamos tus datos personales solo con el propósito de procesar pedidos. Esto incluye procesar tus pedidos, enviar confirmaciones de pedidos, proporcionar soporte al cliente y mantenerte actualizado sobre el estado de tus pedidos.

3. Compartir datos

No compartimos tus datos personales con ninguna otra parte excepto cuando sea necesario para el procesamiento de pedidos (por ejemplo, compartiendo tu información con procesadores de pago). No vendemos, intercambiamos ni alquilamos tu información personal a otras partes.

4. Privacidad de los niños

Muegano no está destinado a menores de 13 años. No recopilamos intencionadamente información personal de menores. Si eres padre/madre/tutor y crees que tu hijo nos ha proporcionado información personal, por favor contáctanos en la dirección de correo electrónico proporcionada a continuación.

5. Actualizaciones a la Política de Privacidad

Podemos actualizar esta Política de Privacidad de vez en cuando para reflejar cambios en nuestras prácticas o por razones operativas, legales o reguladoras. Cualquier actualización se publicará en esta página, y es posible que te notifiquemos por correo electrónico sobre cambios significativos.

6. Información de contacto

Si tienes alguna pregunta, inquietud o solicitud relacionada con esta Política de Privacidad, puedes contactarnos en:

Correo electrónico: marc@shipfa.st

Para todas las demás consultas, por favor visita nuestra página de Contacto en el Sitio Web.

Al usar Muegano, aceptas los términos de esta Política de Privacidad.`}
        </pre>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
