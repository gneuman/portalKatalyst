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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header sticky */}
      <div className="sticky top-0 z-40 bg-white">
        <Header />
      </div>
      <div className="flex flex-1 min-h-0 bg-white">
        {/* Sidebar tipo drawer en móvil, fijo en desktop */}
        <aside
          className={`
            fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity lg:static lg:bg-transparent
            ${sidebarOpen ? "block" : "hidden"} lg:block
          `}
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className={`
              w-72 max-w-full bg-white shadow-lg flex flex-col py-8 px-4 gap-4 h-full
              transform transition-transform duration-200 ease-in-out
              ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              } lg:translate-x-0
              fixed left-0 top-0 bottom-0 lg:static
              lg:sticky lg:top-0
            `}
            onClick={(e) => e.stopPropagation()}
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
                  pathname.startsWith("/dashboard/personal")
                    ? "page"
                    : undefined
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
                  pathname.startsWith("/dashboard/empresas")
                    ? "page"
                    : undefined
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
          </div>
        </aside>
        {/* Main content expandido, fondo blanco, sin padding extra, ocupa todo el ancho */}
        <main className="flex-1 flex flex-col min-h-screen w-full bg-white rounded-none shadow-none p-0 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
