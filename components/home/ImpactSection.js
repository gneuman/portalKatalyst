import ImpactCard from "./ImpactCard";

export default function ImpactSection() {
  const impacts = [
    {
      number: "1000+",
      title: "Estudiantes Beneficiados",
      description:
        "Personas que han participado en nuestros programas educativos",
    },
    {
      number: "50+",
      title: "Comunidades",
      description: "Comunidades impactadas por nuestros programas",
    },
    {
      number: "100%",
      title: "Compromiso",
      description: "Dedicación total a la transformación social",
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {impacts.map((impact, index) => (
            <ImpactCard key={index} {...impact} />
          ))}
        </div>
      </div>
    </section>
  );
}
