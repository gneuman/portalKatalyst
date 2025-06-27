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
    <div className="min-h-screen bg-white flex flex-row">
      {/* Sidebar sticky/fijo a la izquierda */}
      <aside
        className={`
          w-72 max-w-full bg-white shadow-lg flex flex-col py-8 px-4 gap-4 h-screen
          fixed left-0 top-0 bottom-0 z-40
          lg:sticky lg:top-0
        `}
        style={{ minHeight: "100vh" }}
      >
        <PerfilConLogo />
        <nav className="flex flex-col gap-2 mt-8">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#F5F6F7] transition border-l-4 ${
              pathname === "/dashboard"
                ? "bg-[#E3E8EF] font-bold border-[#233746] text-[#233746]"
                : "border-transparent"
            }`}
            aria-current={pathname === "/dashboard" ? "page" : undefined}
          >
            <span className="text-[#6443B6]">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path
                  d="M3 13h2v-2H3v2zm4 0h2v-2H7v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2z"
                  fill="currentColor"
                />
              </svg>
            </span>
            Para ti
          </Link>
          <div className="border-b my-2 border-gray-200" />
          <Link
            href="/dashboard/personal"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#F5F6F7] transition border-l-4 ${
              pathname.startsWith("/dashboard/personal")
                ? "bg-[#E3E8EF] font-bold border-[#54B8B4] text-[#233746]"
                : "border-transparent"
            }`}
            aria-current={
              pathname.startsWith("/dashboard/personal") ? "page" : undefined
            }
          >
            <FaUser className="text-[#54B8B4]" />
            Perfil Personal
          </Link>
          <div className="border-b my-2 border-gray-200" />
          <Link
            href="/dashboard/empresas"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#F5F6F7] transition border-l-4 ${
              pathname.startsWith("/dashboard/empresas")
                ? "bg-[#E3E8EF] font-bold border-[#FC9B42] text-[#233746]"
                : "border-transparent"
            }`}
            aria-current={
              pathname.startsWith("/dashboard/empresas") ? "page" : undefined
            }
          >
            <FaBuilding className="text-[#FC9B42]" />
            Empresas
          </Link>
          <div className="flex justify-center mt-4">
            <ButtonAccount />
          </div>
        </nav>
        <div className="flex-1" />
        <div className="text-xs text-gray-400 text-center mt-8">
          Portal Katalyst
        </div>
      </aside>
      {/* Contenedor derecho: header sticky + children */}
      <div className="flex-1 flex flex-col ml-72 min-h-screen bg-white">
        {/* Header sticky dentro de la columna derecha */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <Header />
        </div>
        {/* Contenido principal con padding-top para no quedar oculto bajo el header sticky */}
        <main className="flex-1 flex flex-col w-full bg-white rounded-none shadow-none p-0 sm:p-8 pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
