"use client";
import { MotionConfig } from "motion/react";
import { Nav } from "./nav";
import { Hero } from "./hero";
import { Assets } from "./assets";
import { Steps } from "./steps";
import { Stats } from "./stats";
import { Footer } from "./footer";

export function Landing() {
  return (
    <MotionConfig reducedMotion="user">
      <Nav />
      <main>
        <Hero />
        <Assets />
        <Steps />
        <Stats />
        <Footer />
      </main>
    </MotionConfig>
  );
}
