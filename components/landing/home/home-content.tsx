"use client";

import { SiteHeader } from "../site-header";
import { HeroSection } from "./hero-section";
import { CetpOverview } from "./cetp-overview";
import { AboutSlideshow } from "./about-slideshow";
import { ContactSection } from "./contact-section";
import { SiteFooter } from "../site-footer";

export function HomeContent() {
  return (
    <div className="relative bg-background">
      <SiteHeader />
      <HeroSection />
      <CetpOverview />
      <AboutSlideshow />
      <ContactSection />
      <SiteFooter />
    </div>
  );
}
