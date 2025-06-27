"use client";

import { useSearchParams } from "next/navigation";
import UserProfileForm from "@/components/UserProfileForm";

export default function Page() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  if (!email) {
    return <div>Falta el email</div>;
  }

  return <UserProfileForm email={email} mode="update" />;
}
