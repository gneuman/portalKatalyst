"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaUser, FaBuilding } from "react-icons/fa";
import Header from "@/components/Header";
import ProfileCard from "@/components/ProfileCard";
import ButtonAccount from "@/components/ButtonAccount";

// This is a server-side component to ensure the user is logged in.
// If not, it will redirect to the login page.
// It's applied to all subpages of /dashboard in /app/dashboard/*** pages
// You can also add custom static UI elements like a Navbar, Sidebar, Footer, etc..
// See https://shipfa.st/docs/tutorials/private-page
export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[#F5F6F7] flex flex-col">
      {/* Nuevo Header tipo Figma */}
      <Header />
      <div className="flex flex-1 min-h-0">
        {/* Sidebar visual tipo Figma */}
        <aside className="w-80 bg-white shadow-lg flex flex-col py-8 px-4 gap-4">
          <ProfileCard />
          <nav className="flex flex-col gap-2 mt-8">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#F5F6F7] transition ${
                pathname === "/dashboard" ? "bg-[#E3E8EF] font-bold" : ""
              }`}
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
            <Link
              href="/dashboard/personal"
              className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#F5F6F7] transition ${
                pathname.startsWith("/dashboard/personal")
                  ? "bg-[#E3E8EF] font-bold"
                  : ""
              }`}
            >
              <FaUser className="text-[#54B8B4]" />
              Perfil Personal
            </Link>
            <Link
              href="/dashboard/empresas"
              className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#F5F6F7] transition ${
                pathname.startsWith("/dashboard/empresas")
                  ? "bg-[#E3E8EF] font-bold"
                  : ""
              }`}
            >
              <FaBuilding className="text-[#FC9B42]" />
              Empresas
            </Link>
            <div className="flex justify-center">
              <ButtonAccount />
            </div>
          </nav>
          <div className="flex-1" />
          <div className="text-xs text-gray-400 text-center mt-8">
            Portal Katalyst
          </div>
        </aside>
        {/* Main content expandido, fondo blanco, sin padding extra, ocupa todo el ancho */}
        <main className="flex-1 flex flex-col min-h-screen w-full bg-white rounded-none shadow-none p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
