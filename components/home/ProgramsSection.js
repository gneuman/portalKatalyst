import {
  FaGraduationCap,
  FaUsers,
  FaLightbulb,
  FaHandshake,
} from "react-icons/fa";
import ProgramCard from "./ProgramCard";

export default function ProgramsSection() {
  const programs = [
    {
      icon: <FaGraduationCap className="w-12 h-12 text-blue-600" />,
      title: "Educación Digital",
      description:
        "Programas de alfabetización digital y habilidades tecnológicas para todas las edades.",
    },
    {
      icon: <FaUsers className="w-12 h-12 text-blue-600" />,
      title: "Comunidad",
      description:
        "Iniciativas para fortalecer la comunidad y crear oportunidades de desarrollo.",
    },
    {
      icon: <FaLightbulb className="w-12 h-12 text-blue-600" />,
      title: "Innovación",
      description:
        "Fomentamos la innovación y el emprendimiento en la comunidad.",
    },
    {
      icon: <FaHandshake className="w-12 h-12 text-blue-600" />,
      title: "Alianzas",
      description:
        "Trabajamos con organizaciones y empresas para maximizar nuestro impacto.",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Nuestros Programas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {programs.map((program, index) => (
            <ProgramCard key={index} {...program} />
          ))}
        </div>
      </div>
    </section>
  );
}
