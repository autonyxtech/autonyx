import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { BRAND, siteConfig, socialLinks } from '@/content/site';
import { BookCallButton } from '@/components/ui/BookCallButton';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-panel section-shell">
        <div className="footer-cta">
          <div>
            <p className="eyebrow">A more useful first impression</p>
            <h2>Make every enquiry easier to handle.</h2>
            <p>Let’s find the right website or automation to move your business forward.</p>
          </div>
          <BookCallButton className="button button-primary">
            Start a conversation <ArrowRight size={16} aria-hidden="true" />
          </BookCallButton>
        </div>

        <div className="footer-main">
          <div className="footer-brand">
            <Link href="/" className="brand-lockup" aria-label={`${BRAND.name} home`}>
              <Image
                className="brand-image"
                src="/brand/logo.png"
                alt=""
                width={1408}
                height={768}
                aria-hidden="true"
              />
              <span className="brand-copy">
                <span className="brand-name">{BRAND.name}</span>
                <span className="brand-caption">AI systems for real business work.</span>
              </span>
            </Link>
            <p>{siteConfig.footer.legal}</p>
          </div>

          <nav className="footer-column" aria-label="Explore">
            <h2>Explore</h2>
            {siteConfig.nav.map((item) => (
              <Link key={item.href} href={item.href.startsWith('#') ? `/${item.href}` : item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="footer-column footer-contact">
            <h2>Get in touch</h2>
            <a href={`mailto:${BRAND.email}`}>
              <span>{BRAND.email}</span><ArrowUpRight size={14} aria-hidden="true" />
            </a>
            {socialLinks.filter((item) => item.label !== 'Email').map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                <span>{item.label}</span><ArrowUpRight size={14} aria-hidden="true" />
              </a>
            ))}
            <Link href="/privacy-policy/">Privacy policy</Link>
            <Link href="/terms/">Terms of service</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</span>
          <span>Built for clarity. Designed to be useful.</span>
        </div>
      </div>
    </footer>
  );
}
