import Image from "next/image";

const defaultItems = [
  {
    title: "Digital academy",
    subtitle:
      "Encuentra el contenido más actualizado para que sigas aprendiendo lo más relevante para el mundo profesional. Podcasts, videos y más",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80",
    cta: "VER MÁS",
    banner: "Sección donada por la familia Zaga",
    url: "#",
  },
  {
    title: "Cursos grupales",
    subtitle:
      "En Katakyst te ofrecemos los mejores cursos profesionales que te llevarán al siguiente nivel. Inscríbete a tu favorito. ¡Algunos son gratis!",
    image:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80",
    cta: "VER MÁS",
    banner: "Sección donada por la familia Levy",
    url: "#",
  },
  {
    title: "Mis cupones",
    subtitle:
      "Más de 200 empresas ACTIVA tienen las mejores promociones para ti. Descárgalas ahora.",
    image:
      "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80",
    cta: "VER MÁS",
    banner: "Sección donada por la familia Zonana",
    url: "#",
  },
  // ...agrega más cards de ejemplo según el Figma
];

export default function CardGrid({
  items = defaultItems,
  emptyState,
  renderCard,
  columns = {
    sm: 1,
    md: 2,
    lg: 3,
  },
}) {
  if (!items || items.length === 0) {
    return (
      emptyState || (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            {emptyState?.icon || <div className="h-8 w-8 text-blue-600" />}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {emptyState?.title || "No hay elementos"}
          </h3>
          <p className="text-gray-500 mb-6">
            {emptyState?.description || "No hay elementos para mostrar"}
          </p>
          {emptyState?.action && (
            <button
              onClick={emptyState.action.onClick}
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {emptyState.action.label}
            </button>
          )}
        </div>
      )
    );
  }

  const renderDefaultCard = (item, index) => (
    <div
      key={index}
      className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col border border-gray-200"
    >
      {/* Banner superior morado */}
      <div className="bg-[#7C5FD3] text-white text-xs font-semibold text-center py-2 px-2">
        {item.banner}
      </div>
      {/* Imagen */}
      <div className="relative w-full h-36">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover"
        />
      </div>
      {/* Contenido */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-lg text-gray-800 mb-1">{item.title}</h3>
          <p className="text-gray-600 text-sm mb-2">{item.subtitle}</p>
        </div>
      </div>
      {/* Botón */}
      <div className="bg-[#223444] px-4 py-3 text-center">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-block bg-transparent text-white font-semibold text-sm tracking-widest"
        >
          {item.cta}
        </a>
      </div>
    </div>
  );

  return (
    <div
      className={`grid grid-cols-1 gap-6 sm:grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg}`}
    >
      {(items || defaultItems).map(renderCard || renderDefaultCard)}
    </div>
  );
}
