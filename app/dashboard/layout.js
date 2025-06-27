"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaUser, FaBuilding } from "react-icons/fa";
import Header from "@/components/Header";
import PerfilConLogo from "../../components/PerfilConLogo";
import ButtonAccount from "@/components/ButtonAccount";
import { useState } from "react";

// This is a server-side component to ensure the user is logged in.
// If not, it will redirect to the login page.
// It's applied to all subpages of /dashboard in /app/dashboard/*** pages
// You can also add custom static UI elements like a Navbar, Sidebar, Footer, etc..
// See https://shipfa.st/docs/tutorials/private-page
export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-row">
      {/* Sidebar drawer en móvil, fijo en desktop */}
      {/* Overlay para móvil */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={`
          w-64 max-w-full bg-white shadow-lg flex flex-col py-6 px-3 gap-3 h-screen
          fixed left-0 top-0 bottom-0 z-50 transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:block
        `}
        style={{ minHeight: "100vh" }}
      >
        <button
          className="lg:hidden self-end mb-3 p-2 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#233746]"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path
              d="M6 6l12 12M6 18L18 6"
              stroke="#233746"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <PerfilConLogo />
        <nav className="flex flex-col gap-1 mt-6">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#F5F6F7] transition border-l-4 ${
              pathname === "/dashboard"
                ? "bg-[#E3E8EF] font-bold border-[#233746] text-[#233746]"
                : "border-transparent"
            }`}
            aria-current={pathname === "/dashboard" ? "page" : undefined}
          >
            <span className="text-[#6443B6]">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path
                  d="M3 13h2v-2H3v2zm4 0h2v-2H7v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="text-sm">Para ti</span>
          </Link>
          <div className="border-b my-1 border-gray-200" />
          <Link
            href="/dashboard/personal"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#F5F6F7] transition border-l-4 ${
              pathname.startsWith("/dashboard/personal")
                ? "bg-[#E3E8EF] font-bold border-[#54B8B4] text-[#233746]"
                : "border-transparent"
            }`}
            aria-current={
              pathname.startsWith("/dashboard/personal") ? "page" : undefined
            }
          >
            <FaUser className="text-[#54B8B4] text-sm" />
            <span className="text-sm">Perfil Personal</span>
          </Link>
          <div className="border-b my-1 border-gray-200" />
          <Link
            href="/dashboard/empresas"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#F5F6F7] transition border-l-4 ${
              pathname.startsWith("/dashboard/empresas")
                ? "bg-[#E3E8EF] font-bold border-[#FC9B42] text-[#233746]"
                : "border-transparent"
            }`}
            aria-current={
              pathname.startsWith("/dashboard/empresas") ? "page" : undefined
            }
          >
            <FaBuilding className="text-[#FC9B42] text-sm" />
            <span className="text-sm">Empresas</span>
          </Link>
          <div className="flex justify-center mt-3">
            <ButtonAccount />
          </div>
        </nav>
        <div className="flex-1" />
        <div className="text-xs text-gray-400 text-center mt-6">
          Portal Katalyst
        </div>
      </aside>
      {/* Contenedor derecho: header sticky + children */}
      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen bg-gray-50">
        {/* Header sticky dentro de la columna derecha */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 flex items-center h-14 px-4 sm:px-6 shadow-sm">
          {/* Botón hamburguesa solo en móvil */}
          <button
            className="lg:hidden mr-3 p-2 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#233746]"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="#233746"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="flex-1">
            <Header />
          </div>
        </div>
        {/* Contenido principal optimizado */}
        <main className="flex-1 flex flex-col w-full bg-gray-50 p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
