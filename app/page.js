"use client";
import { Suspense } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/home/HeroSection";
import ProgramsSection from "@/components/home/ProgramsSection";
import ImpactSection from "@/components/home/ImpactSection";
import CTASection from "@/components/home/CTASection";

export default function Home() {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main>
        <HeroSection />
        <ProgramsSection />
        <ImpactSection />
        <CTASection />
      </main>
    </>
  );
}
