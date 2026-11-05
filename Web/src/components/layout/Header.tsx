'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BRAND, siteConfig } from '@/content/site';
import { useBooking } from '@/components/layout/BookingProvider';

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const { openBooking } = useBooking();

  const sectionHref = (href: string) => pathname === '/' ? href : `/${href}`;

  useEffect(() => {
    if (pathname !== '/') {
      setActiveSection('');
      return;
    }

    const sections = siteConfig.nav
      .filter((item) => item.href.startsWith('#'))
      .map((item) => document.querySelector(item.href))
      .filter((section) => section !== null);

    const observer = new window.IntersectionObserver(
      () => {
        const activeLine = window.innerHeight * 0.28;
        const current = sections.find((section) => {
          const bounds = section.getBoundingClientRect();
          return bounds.top <= activeLine && bounds.bottom >= activeLine;
        });
        setActiveSection(current?.id ? `#${current.id}` : '');
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.15, 0.4] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand-lockup" aria-label={`${BRAND.name} home`} onClick={() => setMenuOpen(false)}>
          <Image
            className="brand-image"
            src="/brand/logo.png"
            alt=""
            width={1408}
            height={768}
            priority
            aria-hidden="true"
          />
          <span className="brand-copy">
            <span className="brand-name">{BRAND.shortName}</span>
            <span className="brand-caption">AI, websites & automation</span>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          {siteConfig.nav.filter((item) => item.href.startsWith('#')).map((item) => (
            <Link
              key={item.href}
              href={sectionHref(item.href)}
              className={activeSection === item.href ? 'is-active' : undefined}
              aria-current={activeSection === item.href ? 'location' : undefined}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/contact/" className={pathname === '/contact' ? 'is-active' : undefined} aria-current={pathname === '/contact' ? 'page' : undefined}>
            Contact
          </Link>
        </nav>

        <div className="header-actions">
          <button className="button button-primary header-book" onClick={() => openBooking()} type="button">
            Book a call <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>
      <nav
        id="mobile-navigation"
        className={`mobile-nav ${menuOpen ? 'is-open' : ''}`}
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        {siteConfig.nav.map((item) => (
          <Link
            key={item.href}
            href={item.href.startsWith('#') ? sectionHref(item.href) : item.href}
            onClick={() => setMenuOpen(false)}
            className={item.href === activeSection || (item.href === '/contact/' && pathname === '/contact') ? 'is-active' : undefined}
          >
            <span>{item.label}</span><span className="mobile-nav-arrow" aria-hidden="true">↗</span>
          </Link>
        ))}
        <div className="mobile-menu-bottom">
          <span>Have a project in mind?</span>
          <button type="button" className="button button-primary" onClick={() => { setMenuOpen(false); openBooking(); }}>
            Book a call <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </nav>
    </header>
  );
}
