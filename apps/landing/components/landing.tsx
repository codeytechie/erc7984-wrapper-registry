"use client";
import { MotionConfig } from "motion/react";
import { SmoothScroll } from "./smooth-scroll";
import { Cursor } from "./cursor";
import { Nav } from "./nav";
import { Hero } from "./hero";
import { Manifesto } from "./manifesto";
import { Assets } from "./assets";
import { Steps } from "./steps";
import { Footer } from "./footer";

export function Landing() {
  return (
    <MotionConfig reducedMotion="user">
      <Cursor />
      <SmoothScroll>
        <Nav />
        <main>
          <Hero />
          <Manifesto />
          <Assets />
          <Steps />
          <Footer />
        </main>
      </SmoothScroll>
    </MotionConfig>
  );
}
