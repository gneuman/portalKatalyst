import DonationForm from "@/components/DonationForm";
import {
  FaHeart,
  FaUsers,
  FaGraduationCap,
  FaLaptop,
  FaLightbulb,
  FaHandshake,
  FaChartLine,
  FaGlobe,
} from "react-icons/fa";

export default function DonarPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <FaHeart className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Dona y transforma vidas
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tu donación ayuda a que más personas alcancen su máximo potencial a
            través de la sustentabilidad económica y el desarrollo personal.
            Cada aporte suma para crear un impacto positivo en la sociedad.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Formulario de donación */}
          <div>
            <DonationForm />
          </div>

          {/* Información del impacto */}
          <div className="space-y-8">
            {/* Misión y Visión */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Nuestra Misión
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <FaLightbulb className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Propósito</h3>
                    <p className="text-sm text-gray-600">
                      Guiar a las personas a alcanzar su máximo potencial a
                      través de la sustentabilidad económica.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <FaGlobe className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Visión</h3>
                    <p className="text-sm text-gray-600">
                      Ser la plataforma líder en desarrollo personal y
                      sustentabilidad económica en México.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <FaHandshake className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Valores</h3>
                    <p className="text-sm text-gray-600">
                      Integridad, innovación, impacto social y excelencia en
                      todo lo que hacemos.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Programas y Servicios */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Nuestros Programas
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Desarrollo Personal
                    </h3>
                    <p className="text-sm text-gray-600">
                      Programas de coaching y mentoría para el crecimiento
                      personal y profesional.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Sustentabilidad Económica
                    </h3>
                    <p className="text-sm text-gray-600">
                      Capacitación en finanzas personales, emprendimiento y
                      gestión empresarial.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Tecnología e Innovación
                    </h3>
                    <p className="text-sm text-gray-600">
                      Programas de capacitación en tecnologías emergentes y
                      transformación digital.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-purple-600 font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Impacto Social
                    </h3>
                    <p className="text-sm text-gray-600">
                      Iniciativas comunitarias y programas de responsabilidad
                      social empresarial.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Nuestro Impacto
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                    <FaUsers className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">1000+</div>
                  <div className="text-sm text-gray-600">
                    Personas beneficiadas
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                    <FaGraduationCap className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">50+</div>
                  <div className="text-sm text-gray-600">
                    Programas impartidos
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                    <FaLaptop className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">2000+</div>
                  <div className="text-sm text-gray-600">
                    Horas de capacitación
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
                    <FaChartLine className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">85%</div>
                  <div className="text-sm text-gray-600">Tasa de éxito</div>
                </div>
              </div>
            </div>

            {/* Testimonios */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Lo que dicen nuestros beneficiarios
              </h2>
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <p className="text-gray-700 italic mb-2">
                    "Katalyst me ayudó a desarrollar mi potencial y crear mi
                    propio negocio sustentable."
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    - Ana Rodríguez, Emprendedora
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-gray-700 italic mb-2">
                    "Los programas de desarrollo personal transformaron mi
                    perspectiva de vida y carrera."
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    - Carlos Mendoza, Ejecutivo
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-gray-700 italic mb-2">
                    "Gracias a Katalyst pude mejorar mis finanzas personales y
                    planificar mi futuro."
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    - María González, Profesional
                  </p>
                </div>
              </div>
            </div>

            {/* Información de transparencia */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <h2 className="text-xl font-bold mb-4">
                Transparencia y Rendición de Cuentas
              </h2>
              <p className="text-blue-100 mb-4">
                Nos comprometemos a usar cada peso de manera responsable y
                transparente. Publicamos reportes trimestrales sobre el uso de
                las donaciones y el impacto generado.
              </p>
              <button className="bg-white text-blue-600 font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                Ver reportes
              </button>
            </div>

            {/* Información de contacto */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                ¿Tienes preguntas?
              </h2>
              <p className="text-gray-600 mb-4">
                Estamos aquí para ayudarte. Contáctanos si tienes alguna
                pregunta sobre nuestras donaciones o programas.
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:info@katalyst.org.mx"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    info@katalyst.org.mx
                  </a>
                </p>
                <p>
                  <strong>Teléfono:</strong>{" "}
                  <a
                    href="tel:+525512345678"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    +52 55 1234 5678
                  </a>
                </p>
                <p>
                  <strong>Web:</strong>{" "}
                  <a
                    href="https://www.katalyst.org.mx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    www.katalyst.org.mx
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
