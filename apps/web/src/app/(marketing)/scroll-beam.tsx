"use client";

import { motion, useScroll, useSpring, useReducedMotion } from "motion/react";

export function ScrollBeam() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  const reduce = useReducedMotion();

  if (reduce) return null;

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 z-50 h-[2px] origin-left bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 shadow-[0_0_12px_rgba(34,211,238,0.8)] pointer-events-none"
    />
  );
}
