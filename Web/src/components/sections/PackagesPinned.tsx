'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';
import { siteConfig } from '@/content/site';
import { BookCallButton } from '@/components/ui/BookCallButton';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function PackagesPinned() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const stage = stageRef.current;
      const panels = itemRefs.current.filter((panel): panel is HTMLElement => panel !== null);
      const progress = progressRef.current;
      if (!section || !stage || panels.length !== siteConfig.packages.length || !progress) return;

      const media = gsap.matchMedia();
      media.add('(min-width: 768px) and (min-height: 780px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.set(panels, { autoAlpha: 0, y: 34, scale: 0.97 });
        gsap.set(panels[0], { autoAlpha: 1, y: 0, scale: 1 });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=300%',
            pin: stage,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              progress.style.transform = `scaleY(${self.progress})`;
              progress.setAttribute('aria-valuenow', String(Math.round(self.progress * 100)));
            },
          },
        });

        panels.forEach((panel, index) => {
          if (index > 0) timeline.fromTo(
            panel,
            { autoAlpha: 0, y: 34, scale: 0.97 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 0.9 },
          );
          timeline.to(panel, { autoAlpha: 0, y: -24, scale: 1.02, duration: 0.8 });
        });

        return () => {
          timeline.scrollTrigger?.kill();
          timeline.kill();
        };
      });

      return () => media.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section id="packages" className="packages-section" ref={sectionRef} aria-labelledby="packages-title">
      <div className="packages-stage" ref={stageRef}>
        <div className="packages-heading section-shell">
          <div>
            <p className="eyebrow">Ways to work together</p>
            <h2 id="packages-title">Start with what your business needs now.</h2>
            <p className="section-intro">A clear starting point, with room to add more when it makes sense.</p>
          </div>
          <div className="package-rail" aria-label="Package progress">
            <span className="package-rail-track" />
            <span className="package-rail-progress" ref={progressRef} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} role="progressbar" />
            <div className="package-rail-labels">
              {siteConfig.packages.map((item, index) => <span key={item.name}>{String(index + 1).padStart(2, '0')} <b>{item.name}</b></span>)}
            </div>
          </div>
        </div>
        <div className="package-panels section-shell">
          {siteConfig.packages.map((item, index) => (
            <article
              className={`package-panel package-panel-${index + 1}`}
              key={item.name}
              ref={(element) => { itemRefs.current[index] = element; }}
              aria-label={`${item.name} package`}
            >
              <div className="package-panel-number">{String(index + 1).padStart(2, '0')}</div>
              <div className="package-panel-main">
                <p className="eyebrow">{item.price}</p>
                <h3>{item.name}</h3>
                <p className="package-blurb">{item.blurb}</p>
                <div className="package-includes-label">What’s included</div>
                <ul className="package-includes">
                  {item.includes.slice(0, 6).map((feature) => (
                    <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>
                  ))}
                </ul>
                <p className="package-audience">{item.who}</p>
                <BookCallButton packageName={item.name}>Talk about {item.name}</BookCallButton>
              </div>
              <div className="package-panel-aside">
                <span className="package-aside-index">0{index + 1} / 03</span>
                <p>{['A sharper first impression.', 'A faster first response.', 'Less routine work on your team.'][index]}</p>
                <Link href="/contact/" className="text-link">Explore a project <ArrowRight size={15} aria-hidden="true" /></Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
