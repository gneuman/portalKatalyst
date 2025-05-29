import Link from "next/link";

export default function CTASection() {
  return (
    <section className="bg-blue-600 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">
          ¿Quieres ser parte del cambio?
        </h2>
        <p className="text-xl mb-8">
          Únete a nuestra misión de transformar vidas a través de la educación y
          la tecnología
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/donar"
            className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition duration-300"
          >
            Donar
          </Link>
          <Link
            href="/voluntariado"
            className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition duration-300"
          >
            Ser Voluntario
          </Link>
        </div>
      </div>
    </section>
  );
}
