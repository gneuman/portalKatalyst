import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/libs/next-auth";
import ActividadesView from "@/components/dashboard/ActividadesView";

export default async function ActividadesPage({ params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const { boardId, itemId } = params;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Mis Actividades
            </h1>
            <p className="mt-2 text-gray-600">
              Aquí puedes ver todas las actividades asignadas a tu programa
            </p>
          </div>

          <ActividadesView
            boardId={boardId}
            itemId={itemId}
            boardName="Programa"
          />
        </div>
      </div>
    </div>
  );
}
