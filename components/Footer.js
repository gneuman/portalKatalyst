import Link from "next/link";
import { FaInstagram, FaLinkedin, FaWhatsapp } from "react-icons/fa";

// Add the Footer to the bottom of your landing page and more.
// The support link is connected to the config.js file. If there's no config.resend.supportEmail, the link won't be displayed.

export default function Footer() {
  return (
    <footer className="bg-[#232F36] text-white py-8 mt-12">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-xl font-bold tracking-widest mb-2">KATALYST</h2>
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Katalyst. Todos los derechos
            reservados.
          </p>
        </div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a
            href="https://wa.me/5215555555555"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
          >
            <FaWhatsapp className="w-6 h-6 hover:text-[#FFA726] transition" />
          </a>
          <a
            href="https://instagram.com/katalystmx"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <FaInstagram className="w-6 h-6 hover:text-[#FFA726] transition" />
          </a>
          <a
            href="https://linkedin.com/company/katalystmx"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <FaLinkedin className="w-6 h-6 hover:text-[#FFA726] transition" />
          </a>
        </div>
        <div className="text-center md:text-right text-gray-400 text-xs mt-4 md:mt-0">
          Hecho con ❤️ por el equipo Katalyst
        </div>
      </div>
    </footer>
  );
}
