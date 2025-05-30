import Image from "next/image";
import TestimonialsAvatars from "./TestimonialsAvatars";
import ButtonAccount from "./ButtonAccount";
import config from "@/config";

const Hero = () => {
  return (
    <section className="max-w-7xl mx-auto bg-base-100 flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-20 px-8 py-8 lg:py-20">
      <div className="flex flex-col gap-10 lg:gap-14 items-center justify-center text-center lg:text-left lg:items-start">
        <div className="badge badge-primary badge-lg">Nuevo</div>

        <h1 className="font-extrabold text-4xl lg:text-6xl tracking-tight md:-mb-4">
          Crea tu comunidad en minutos, no en días
        </h1>
        <p className="text-lg opacity-80 leading-relaxed">
          La plataforma más simple para crear y gestionar tu comunidad online.
          Conecta con tu audiencia, comparte contenido y haz crecer tu comunidad
          sin complicaciones técnicas.
        </p>
        <ButtonAccount />

        <TestimonialsAvatars priority={true} />
      </div>
      <div className="lg:w-full">
        <Image
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80"
          alt="Comunidad Online"
          className="w-full rounded-lg shadow-2xl"
          priority={true}
          width={500}
          height={500}
        />
      </div>
    </section>
  );
};

export default Hero;
