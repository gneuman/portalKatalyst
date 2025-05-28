import { useSession } from "next-auth/react";
import ButtonAccount from "@/components/ButtonAccount";

export default function DashboardLayout({ children, title, subtitle }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {title ||
                  `¡Hola, ${
                    session?.user?.name || session?.user?.email || "Usuario"
                  }!`}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {subtitle || "Gestiona tu contenido desde aquí"}
              </p>
            </div>
            <div className="flex space-x-4">
              <ButtonAccount session={session} />
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
