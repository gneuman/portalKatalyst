import ProfileCard from "./ProfileCard";
import Image from "next/image";

export default function PerfilConLogo() {
  return (
    <div className="flex flex-col items-center w-full gap-4">
      <div className="w-full flex justify-center mb-2">
        <div className="bg-[#1C384A] rounded-xl p-3 flex items-center justify-center w-full">
          <Image
            src="/images/Katalyst.png"
            alt="Katalyst Logo"
            width={180}
            height={52}
            className="object-contain"
          />
        </div>
      </div>
      <ProfileCard />
    </div>
  );
}
