import Image from "next/image";

const CARDS = [
  {
    id: 1,
    topBar: "Sección donada por la familia Zaga",
    image: "/public/blog/introducing-supabase/header.png",
    title: "Digital academy",
    description:
      "Encuentra el contenido más actualizado para que sigas aprendiendo lo más relevante para el mundo profesional. Podcasts, videos y más",
    button: "VER MÁS",
  },
  {
    id: 2,
    topBar: "Sección donada por la familia Levy",
    image: "/public/images/Katalyst.png",
    title: "Cursos grupales",
    description:
      "En ACTIVA te ofrecemos los mejores cursos profesionales que te llevarán al siguiente nivel. Inscríbete a tu favorito. ¡Algunos son gratis!",
    button: "VER MÁS",
  },
  {
    id: 3,
    topBar: "Sección donada por la familia Zonana",
    image: "/public/images/Katalyst.png",
    title: "Mis cupones",
    description:
      "Más de 200 empresas ACTIVA tienen las mejores promociones para ti. Descárgalas ahora.",
    button: "VER MÁS",
  },
];

export default function ParaTiSection() {
  return (
    <section className="w-full max-w-6xl mx-auto py-10 px-4">
      <h2 className="text-3xl font-bold mb-8">Para ti</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {CARDS.map((card) => (
          <div
            key={card.id}
            className="rounded-xl shadow-lg bg-white flex flex-col overflow-hidden"
          >
            <div className="bg-purple-600 text-white text-xs font-semibold px-4 py-2">
              {card.topBar}
            </div>
            <div className="relative w-full h-40">
              <Image
                src={card.image.replace("/public", "")}
                alt={card.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col flex-1 p-4">
              <h3 className="text-lg font-bold mb-2">{card.title}</h3>
              <p className="text-gray-700 text-sm mb-4 flex-1">
                {card.description}
              </p>
              <button className="mt-auto bg-[#1C384A] text-white font-semibold py-2 px-4 rounded hover:bg-[#163040] transition">
                {card.button}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
