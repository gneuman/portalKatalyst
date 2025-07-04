"use client";
import { FaBuilding, FaUser, FaBook, FaClock, FaPlay } from "react-icons/fa";
import CardGrid from "@/components/dashboard/CardGrid";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import ProgramasGrid from "@/components/dashboard/ProgramasGrid";
import ProgramasHistorial from "@/components/dashboard/ProgramasHistorial";
import ProgramasBoardsInfo from "@/components/dashboard/ProgramasBoardsInfo";

// Programas estáticos antiguos
const programasEstaticos = [
  {
    nombre: "empresas",
    "título visible": "Empresas",
    descripcion: "Administra y consulta información de empresas.",
    "ruta destino": "/dashboard/empresas",
    alwaysEnabled: false,
  },
  {
    nombre: "personal",
    "título visible": "Personal",
    descripcion: "Gestión de personal y colaboradores.",
    "ruta destino": "/dashboard/personal",
    alwaysEnabled: false,
  },
  {
    nombre: "profile",
    "título visible": "Mi Perfil",
    descripcion: "Consulta y edita tu información personal.",
    "ruta destino": "/dashboard/profile",
    alwaysEnabled: true,
  },
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [programas, setProgramas] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Obtener el Katalyst ID del perfil del usuario (siempre el mismo campo)
  const [katalystId, setKatalystId] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // Obtener el personalMondayId desde MongoDB
  useEffect(() => {
    async function fetchUserData() {
      if (!session?.user?.email) {
        setUserLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/user/profile?email=${session.user.email}`
        );
        const userData = await res.json();
        setKatalystId(userData.personalMondayId || null);
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
      } finally {
        setUserLoading(false);
      }
    }

    fetchUserData();
  }, [session?.user?.email]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchProgramas() {
      setLoading(true);
      try {
        const res = await fetch("/api/programas");
        const data = await res.json();
        setProgramas(data.programas || []);
        setColumns(data.columns || []);
      } catch (err) {
        setProgramas([]);
        setColumns([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProgramas();
  }, []);

  // Ahora todos los programas se muestran habilitados
  const allProgramas = programas.map((prog) => ({
    ...prog,
    alwaysEnabled: true,
  }));

  if (status === "loading" || loading || userLoading)
    return <div>Cargando...</div>;

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
    <div className="max-w-7xl mx-auto py-8 px-4 bg-white min-h-screen">
      {/* Mensaje de bienvenida y Katalyst ID */}
      {session?.user && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-1">
            Bienvenido a Katalyst, {session.user.name || session.user.email}
          </h3>
          {katalystId && (
            <div className="text-gray-500 text-sm">
              Tu ID de Katalyst: <span className="font-mono">{katalystId}</span>
            </div>
          )}
        </div>
      )}
      {/* Cards principales */}
      <h2 className="text-2xl font-bold mt-8 mb-4">Para ti</h2>
      <CardGrid />

      {/* Sección de Programas dinámicos */}
      <h2 className="text-2xl font-bold mt-8 mb-4">Programas</h2>
      <ProgramasGrid
        programas={allProgramas}
        columns={columns}
        katalystId={katalystId}
        userName={session?.user?.name || session?.user?.email}
      />

      {/* Sección de Historial de Programas */}
      <h2 className="text-2xl font-bold mt-8 mb-4">Mis Programas</h2>
      <ProgramasHistorial />

      {/* Sección de Configuración de Programas */}
      {/* <h2 className="text-2xl font-bold mt-8 mb-4">
        Configuración de Programas
      </h2>
      <ProgramasBoardsInfo /> */}

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
