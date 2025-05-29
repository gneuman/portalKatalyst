import Link from "next/link";

export default function DonarPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-[#232F36]">
          Dona y transforma vidas
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          Tu donación ayuda a que más personas accedan a educación y tecnología
          de calidad a través de Katalyst. Cada aporte suma y nos permite llegar
          más lejos.
        </p>
        <a
          href="https://donar.katalyst.org.mx" // Cambia por tu enlace real de donación
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-[#FFA726] text-white font-semibold px-8 py-3 rounded-full shadow hover:bg-[#ff9800] transition mb-4"
        >
          Donar ahora
        </a>
        <div className="mt-4">
          <Link href="/dashboard">
            <span className="inline-block bg-[#232F36] text-white font-semibold px-6 py-2 rounded-full hover:bg-[#1B2328] transition">
              Ir al Dashboard
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
