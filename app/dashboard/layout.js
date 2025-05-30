"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaUser, FaBuilding, FaChartBar } from "react-icons/fa";
import ButtonAccount from "@/components/ButtonAccount";
import Image from "next/image";

// This is a server-side component to ensure the user is logged in.
// If not, it will redirect to the login page.
// It's applied to all subpages of /dashboard in /app/dashboard/*** pages
// You can also add custom static UI elements like a Navbar, Sidebar, Footer, etc..
// See https://shipfa.st/docs/tutorials/private-page
export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header alineado */}
      <div className="bg-[#232F36] py-4 px-6 flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Image
            src="/images/Katalyst.png"
            alt="Katalyst Logo"
            width={120}
            height={40}
            className="object-contain"
          />
        </div>
        <div className="flex items-center">
          <ButtonAccount />
        </div>
      </div>
      <div className="flex flex-1 min-h-0 bg-gray-50">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg flex flex-col py-8 px-4 gap-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Dashboard</h2>
          <nav className="flex flex-col gap-2">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-100 transition ${
                pathname === "/dashboard" ? "bg-blue-200 font-bold" : ""
              }`}
            >
              <FaChartBar className="text-blue-600" />
              Resumen
            </Link>
            <Link
              href="/dashboard/personal"
              className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-100 transition ${
                pathname.startsWith("/dashboard/personal")
                  ? "bg-blue-200 font-bold"
                  : ""
              }`}
            >
              <FaUser className="text-green-600" />
              Perfil Personal
            </Link>
            <Link
              href="/dashboard/empresas"
              className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-100 transition ${
                pathname.startsWith("/dashboard/empresas")
                  ? "bg-blue-200 font-bold"
                  : ""
              }`}
            >
              <FaBuilding className="text-yellow-600" />
              Empresas
            </Link>
          </nav>
          <div className="flex-1" />
          <div className="text-xs text-gray-400 text-center mt-8">
            Portal Katalyst
          </div>
        </aside>
        {/* Main content expandido */}
        <main className="flex-1 flex flex-col min-h-screen w-full bg-base-100 rounded-none shadow-none p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
