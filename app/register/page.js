"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  // Estados para el proceso secuencial
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stepStatus, setStepStatus] = useState({
    processing: "pending",
    redirect: "pending",
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const steps = [
    {
      id: "processing",
      title: "Procesando registro",
      description: "Sincronizando con Monday.com...",
    },
    {
      id: "redirect",
      title: "Redirigiendo",
      description: "Completando proceso...",
    },
  ];

  useEffect(() => {
    if (!email) {
      router.push("/register/initial");
      return;
    }
    startRegistrationProcess();
  }, [email, router]);

  const startRegistrationProcess = async () => {
    setLoading(true);
    try {
      await updateStepStatus("processing", "processing");
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      await updateStepStatus("processing", "completed");
      await updateStepStatus("redirect", "processing");
      setShowSuccess(true);
      setTimeout(() => {
        window.location.href = `/api/auth/signin?email=${encodeURIComponent(
          email
        )}`;
      }, 2000);
      await updateStepStatus("redirect", "completed");
    } catch (error) {
      console.error("Error en el proceso:", error);
      // No mostrar toast de error
    } finally {
      setLoading(false);
    }
  };

  const updateStepStatus = async (stepId, status) => {
    setStepStatus((prev) => ({ ...prev, [stepId]: status }));
    const currentIndex = steps.findIndex((step) => step.id === stepId);
    if (currentIndex >= 0) setCurrentStep(currentIndex + 1);
  };

  const getStepIcon = (status, stepId) => {
    switch (status) {
      case "completed":
        return (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case "processing":
        return (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          </div>
        );
      case "error":
        return (
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-semibold text-sm">
              {steps.findIndex((step) => step.id === stepId) + 1}
            </span>
          </div>
        );
    }
  };

  const getStepColor = (status) => {
    switch (status) {
      case "completed":
        return "border-green-500 bg-green-50";
      case "processing":
        return "border-blue-500 bg-blue-50";
      case "error":
        return "border-red-500 bg-red-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Procesando registro
          </h1>
          <p className="text-gray-600">
            {email ? `Para: ${email}` : "Procesando tu registro..."}
          </p>
        </div>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center p-4 rounded-lg border-2 transition-all duration-300 ${getStepColor(
                stepStatus[step.id]
              )}`}
            >
              {getStepIcon(stepStatus[step.id], step.id)}
              <div className="ml-4 flex-1">
                <h3 className="font-semibold text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        {showSuccess && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
              ¡Te hemos enviado un correo de acceso! Revisa tu bandeja de
              entrada y sigue el enlace para continuar.
            </div>
          </div>
        )}
        {loading && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800 mr-2"></div>
              Procesando...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
