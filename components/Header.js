"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ButtonAccount from "./ButtonAccount";
import { useSession } from "next-auth/react";

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
              width={160}
              height={56}
              className="rounded-xl bg-[#232F36] p-2 w-auto h-8 sm:h-14"
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
          } absolute top-full left-0 right-0 bg-white shadow-lg z-50`}
        >
          <div className="px-4 py-3 space-y-3">
            <button className="w-full bg-[#FFA726] hover:bg-[#ffb74d] text-white font-semibold px-6 py-2 rounded-md shadow transition">
              DONA AHORA
            </button>
            <button className="w-full bg-[#FFA726] hover:bg-[#ffb74d] text-white font-semibold px-6 py-2 rounded-md shadow transition">
              INVITA A UN AMIGO
            </button>
            <button className="w-full bg-[#FFA726] hover:bg-[#ffb74d] text-white font-semibold px-6 py-2 rounded-md shadow transition">
              MI PERFIL
            </button>
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
