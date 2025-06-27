"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import UserProfileForm from "@/components/UserProfileForm";

function UpdatePageContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  if (!email) {
    return <div>Falta el email</div>;
  }

  return <UserProfileForm email={email} mode="update" />;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <UpdatePageContent />
    </Suspense>
  );
}
