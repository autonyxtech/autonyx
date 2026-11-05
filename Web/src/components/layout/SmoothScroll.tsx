'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) return;

    const lenis = new Lenis({
      duration: 1.35,
      easing: (time) => 1 - (1 - time) ** 4,
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.05,
      anchors: true,
    });

    const updateScrollTrigger = () => ScrollTrigger.update();
    const onTick = (time: number) => lenis.raf(time * 1000);

    lenis.on('scroll', updateScrollTrigger);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    const refreshAfterFonts = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(() => {
      if (lenis.isStopped) return;
      refreshAfterFonts();
    });

    return () => {
      lenis.off('scroll', updateScrollTrigger);
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);

  return children;
}
