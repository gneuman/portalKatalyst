"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ButtonAccount from "./ButtonAccount";
import { useSession } from "next-auth/react";

const links = [
  {
    href: "/programas",
    label: "Programas",
  },
  {
    href: "/blog",
    label: "Blog",
  },
  {
    href: "/nosotros",
    label: "Nosotros",
  },
];

// A header with a logo on the left, links in the center (like Pricing, etc...), and a CTA (like Get Started or Login) on the right.
// The header is responsive, and on mobile, the links are hidden behind a burger button.
function HeaderContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const search = searchParams.get("search") || "";

  return (
    <header className="bg-[#232F36] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6 gap-4">
          <div className="flex items-center gap-3 min-w-[160px]">
            {/* Aquí puedes agregar el logo cuando lo tengas */}
            {/* <Image src="/logo.png" alt="Katalyst Logo" width={40} height={40} /> */}
            <Link
              href="/"
              className="text-2xl font-bold text-white tracking-widest flex items-center gap-2"
            >
              KATALYST
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8 flex-1 justify-center">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white hover:text-[#FFA726] transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-4 min-w-[140px] justify-end">
            <ButtonAccount />
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Header() {
  return (
    <Suspense
      fallback={
        <header className="bg-[#232F36] shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="animate-pulse h-8 w-32 bg-gray-700 rounded"></div>
              <div className="flex items-center space-x-4">
                <div className="animate-pulse h-6 w-24 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </header>
      }
    >
      <HeaderContent />
    </Suspense>
  );
}
