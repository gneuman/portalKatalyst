import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Transformando vidas a través de la educación y la tecnología
            </h1>
            <p className="text-xl mb-8">
              Katalyst es una organización sin fines de lucro dedicada a
              empoderar a las comunidades a través de programas educativos y
              tecnológicos.
            </p>
            <Link
              href="/programas"
              className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition duration-300"
            >
              Conoce nuestros programas
            </Link>
          </div>
          <div className="md:w-1/2">
            <Image
              src="/images/hero-image.jpg"
              alt="Katalyst Education"
              width={600}
              height={400}
              className="rounded-lg shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
