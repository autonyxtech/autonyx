'use client';

import { useEffect, useRef } from 'react';

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (!video || reduceMotion.matches || connection?.saveData || connection?.effectiveType === '2g') return;

    void video.play().catch(() => {
      // The poster remains visible when autoplay is blocked by the browser.
    });

    return () => video.pause();
  }, []);

  return (
    <div className="hero-video-frame">
      <div className="hero-video-glass" aria-hidden="true" />
      <video
        ref={videoRef}
        className="hero-demo-video"
        muted
        loop
        playsInline
        preload="metadata"
        controls
        aria-label="Autonyx Technologies vertical reel"
      >
        <source src="/video/Autonyx_5_Wajah_Reel.mp4" type="video/mp4" />
      </video>
      <span className="hero-video-caption"><span className="status-dot" /> AUTONYX TECHNOLOGIES</span>
    </div>
  );
}
