"use client";
import { useSession } from "next-auth/react";
import UserProfileForm from "@/components/UserProfileForm";

export default function PerfilPersonal() {
  const { data: session } = useSession();

  if (!session?.user?.email) {
    return <div>No hay sesión activa</div>;
  }

  const handleSuccess = () => {
    // Callback para manejar el éxito en modo personal
    // Puedes agregar lógica específica aquí si es necesario
  };

  return (
    <UserProfileForm
      email={session.user.email}
      mode="personal"
      onSuccess={handleSuccess}
    />
  );
}
