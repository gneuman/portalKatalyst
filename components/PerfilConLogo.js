import Image from "next/image";
import ProfileCard from "./ProfileCard";

export default function PerfilConLogo() {
  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-[340px] flex flex-col items-center mb-4">
        <Image
          src="/images/Katalyst.png"
          alt="Katalyst Logo"
          width={340}
          height={90}
          className="rounded-xl object-contain bg-[#1C384A] p-4 shadow mb-2"
        />
      </div>
      <ProfileCard />
    </div>
  );
}
