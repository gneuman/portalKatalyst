"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ButtonAccount from "./ButtonAccount";
import { useSession } from "next-auth/react";
import { FaUser, FaBuilding } from "react-icons/fa";

const links = [
  {
    href: "/programas",
    label: "Programas",
  },
  {
    href: "/blog",
    label: "Blog",
  },
  {
    href: "/nosotros",
    label: "Nosotros",
  },
];

// A header with a logo on the left, links in the center (like Pricing, etc...), and a CTA (like Get Started or Login) on the right.
// The header is responsive, and on mobile, the links are hidden behind a burger button.
function HeaderContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const search = searchParams.get("search") || "";

  return (
    <header className="bg-[#F5F6F7] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 min-w-[120px] sm:min-w-[180px]">
            <Image
              src="/images/Katalyst.png"
              alt="Katalyst Logo"
              width={72}
              height={72}
              className="rounded-full bg-[#232F36] border-4 border-white w-[72px] h-[72px] object-cover"
            />
          </div>

          {/* Menú hamburguesa para móvil */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none"
            aria-label="Menú"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>

          {/* Menú de navegación - oculto en móvil */}
          <div className="hidden lg:flex items-center gap-3">
            <button className="bg-[#FFA726] hover:bg-[#ffb74d] text-white font-semibold px-6 py-2 rounded-md shadow transition">
              DONA AHORA
            </button>
            <button className="bg-[#FFA726] hover:bg-[#ffb74d] text-white font-semibold px-6 py-2 rounded-md shadow transition">
              INVITA A UN AMIGO
            </button>
            <button className="bg-[#FFA726] hover:bg-[#ffb74d] text-white font-semibold px-6 py-2 rounded-md shadow transition">
              MI PERFIL
            </button>
          </div>

          {/* Buscador - oculto en móvil */}
          <div className="hidden lg:flex items-center bg-white rounded-md shadow px-2 py-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Buscar en la comunidad"
              className="bg-transparent outline-none px-2 py-1 flex-1 text-gray-700"
            />
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
              />
            </svg>
          </div>
        </div>

        {/* Menú móvil */}
        <div
          className={`lg:hidden ${
            isOpen ? "block" : "hidden"
          } fixed inset-0 z-50 bg-black bg-opacity-40`}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Encabezado del menú móvil */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Menú</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-md hover:bg-gray-100"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Contenido del menú móvil */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Sección de navegación principal */}
                <div className="space-y-4">
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#F5F6F7] transition border-l-4 ${
                      pathname === "/dashboard"
                        ? "bg-[#E3E8EF] font-bold border-[#233746] text-[#233746]"
                        : "border-transparent"
                    }`}
                  >
                    <span className="text-[#6443B6]">
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M3 13h2v-2H3v2zm4 0h2v-2H7v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                    Para ti
                  </Link>

                  <Link
                    href="/dashboard/personal"
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#F5F6F7] transition border-l-4 ${
                      pathname.startsWith("/dashboard/personal")
                        ? "bg-[#E3E8EF] font-bold border-[#54B8B4] text-[#233746]"
                        : "border-transparent"
                    }`}
                  >
                    <FaUser className="text-[#54B8B4]" />
                    Perfil Personal
                  </Link>

                  <Link
                    href="/dashboard/empresas"
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#F5F6F7] transition border-l-4 ${
                      pathname.startsWith("/dashboard/empresas")
                        ? "bg-[#E3E8EF] font-bold border-[#FC9B42] text-[#233746]"
                        : "border-transparent"
                    }`}
                  >
                    <FaBuilding className="text-[#FC9B42]" />
                    Empresas
                  </Link>
                </div>

                {/* Separador */}
                <div className="my-6 border-t border-gray-200" />

                {/* Botones de acción */}
                <div className="space-y-3">
                  <button className="w-full bg-[#FFA726] hover:bg-[#ffb74d] text-white font-semibold px-6 py-2 rounded-md shadow transition">
                    DONA AHORA
                  </button>
                  <button className="w-full bg-[#FFA726] hover:bg-[#ffb74d] text-white font-semibold px-6 py-2 rounded-md shadow transition">
                    INVITA A UN AMIGO
                  </button>
                  <button className="w-full bg-[#FFA726] hover:bg-[#ffb74d] text-white font-semibold px-6 py-2 rounded-md shadow transition">
                    MI PERFIL
                  </button>
                </div>

                {/* Buscador */}
                <div className="mt-6">
                  <div className="flex items-center bg-white rounded-md shadow px-2 py-1 border border-gray-200">
                    <input
                      type="text"
                      placeholder="Buscar en la comunidad"
                      className="bg-transparent outline-none px-2 py-1 flex-1 text-gray-700"
                    />
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Pie del menú móvil */}
              <div className="p-4 border-t">
                <p className="text-xs text-gray-400 text-center">
                  Portal Katalyst
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Header() {
  return (
    <Suspense
      fallback={
        <header className="bg-[#232F36] shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="animate-pulse h-8 w-32 bg-gray-700 rounded"></div>
              <div className="flex items-center space-x-4">
                <div className="animate-pulse h-6 w-24 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </header>
      }
    >
      <HeaderContent />
    </Suspense>
  );
}
