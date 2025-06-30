import { Suspense } from "react";
import ProfilePage from "./ProfilePageClient";

export default function ProfilePageWrapper() {
  return (
    <Suspense fallback={<div>Cargando perfil...</div>}>
      <ProfilePage />
    </Suspense>
  );
}
