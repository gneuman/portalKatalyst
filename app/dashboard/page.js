"use client";
import { FaBuilding, FaUser, FaBook, FaClock } from "react-icons/fa";
import CardGrid from "@/components/dashboard/CardGrid";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") return <div>Cargando...</div>;

  // KPIs de ejemplo (puedes conectar estos valores a tu backend o lógica real)
  const kpis = [
    {
      label: "Empresas",
      value: 5,
      icon: <FaBuilding className="text-yellow-600 w-8 h-8" />,
    },
    {
      label: "Personas",
      value: 42,
      icon: <FaUser className="text-green-600 w-8 h-8" />,
    },
    {
      label: "Cursos",
      value: 12,
      icon: <FaBook className="text-blue-600 w-8 h-8" />,
    },
    {
      label: "Horas atendidas",
      value: 87,
      icon: <FaClock className="text-purple-600 w-8 h-8" />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Cards principales */}
      <h2 className="text-2xl font-bold mt-8 mb-4">Para ti</h2>
      <CardGrid />
      {/* Banner visual */}
      <div className="w-full rounded-xl overflow-hidden shadow-lg mt-10 mb-8">
        <div className="relative w-full h-40 sm:h-56">
          <Image
            src="/images/banner-departamentos.jpg"
            alt="Departamentos de 185, 208 y 237 m²"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-[#232F36]/90 flex flex-col justify-center items-center text-center px-4">
            <div className="text-white text-lg sm:text-2xl font-semibold tracking-widest mb-2">
              DEPARTAMENTOS DE
              <br />
              185, 208 Y 237m²
            </div>
            <div className="text-[#FFA726] text-xs sm:text-base tracking-widest">
              ENTREGA: MARZO DEL 2019. PRECIOS DESDE $7.2 MILLONES
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
