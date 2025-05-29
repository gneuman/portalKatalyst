"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ButtonSignin from "./ButtonSignin";
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
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Katalyst
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            {session ? (
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/api/auth/signin"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar..."
                className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue={search}
                onChange={(e) => {
                  const value = e.target.value;
                  const url = new URL(window.location.href);
                  if (value) {
                    url.searchParams.set("search", value);
                  } else {
                    url.searchParams.delete("search");
                  }
                  window.location.href = url.toString();
                }}
              />
            </div>
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
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>
              <div className="flex items-center space-x-4">
                <div className="animate-pulse h-6 w-24 bg-gray-200 rounded"></div>
                <div className="animate-pulse h-10 w-64 bg-gray-200 rounded"></div>
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
