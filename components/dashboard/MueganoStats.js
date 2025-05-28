import { FaUsers, FaComments } from "react-icons/fa";
import { MdPendingActions } from "react-icons/md";
import StatsGrid from "./StatsGrid";

export default function MueganoStats({ instances = [] }) {
  // Aseguramos que instances sea un array
  const userInstances = Array.isArray(instances) ? instances : [];

  const stats = [
    {
      label: "Total de Comunidades",
      value: userInstances.length,
      icon: <FaUsers className="h-6 w-6 text-blue-600" />,
    },
    {
      label: "Comunidades Activas",
      value: userInstances.filter((i) => i.status === "active").length,
      icon: <FaComments className="h-6 w-6 text-green-600" />,
    },
    {
      label: "Comunidades Pendientes",
      value: userInstances.filter((i) => i.status === "pending").length,
      icon: <MdPendingActions className="h-6 w-6 text-yellow-600" />,
    },
  ];

  return <StatsGrid stats={stats} />;
}
