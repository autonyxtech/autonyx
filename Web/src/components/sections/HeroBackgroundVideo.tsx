'use client';

import { useEffect, useRef } from 'react';

export function HeroBackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (!video || reduceMotion.matches || connection?.saveData || connection?.effectiveType === '2g') return;

    const observer = new window.IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        void video.play().catch(() => {
          // Browsers can block autoplay; the hero background remains usable without it.
        });
      } else {
        video.pause();
      }
    }, { threshold: 0.1 });
    observer.observe(video);

    return () => {
      observer.disconnect();
      video.pause();
    };
  }, []);

  return (
    <div className="hero-background-video" aria-hidden="true">
      <video
        ref={videoRef}
        className="hero-background-video-element"
        muted
        loop
        playsInline
        preload="metadata"
        tabIndex={-1}
      >
        <source src="/video/handshake.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
