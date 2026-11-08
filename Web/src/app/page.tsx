import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  CircleHelp,
  Gauge,
  Globe2,
  MessageSquareText,
  PhoneCall,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import { AgentCalculator } from '@/components/sections/AgentCalculator';
import { HeroBackgroundVideo } from '@/components/sections/HeroBackgroundVideo';
import { HeroVideo } from '@/components/sections/HeroVideo';
import { PackagesPinned } from '@/components/sections/PackagesPinned';
import { ChatOpenButton } from '@/components/chat/ChatOpenButton';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BookCallButton } from '@/components/ui/BookCallButton';
import { BRAND, siteConfig } from '@/content/site';

export const metadata: Metadata = {
  title: 'Autonyx Technologies | AI Websites & AI Chat Agents',
  description:
    'Autonyx Technologies builds AI-powered websites, chat agents and workflow automation to help growing businesses capture and respond to enquiries.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Autonyx Technologies | AI automation and business websites',
    description: 'Business websites and AI systems designed to make everyday customer work easier.',
    url: 'https://autonyxtech.in/',
    siteName: BRAND.name,
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: BRAND.name },
};

const serviceIcons = [MessageSquareText, PhoneCall, Workflow, Bot, Globe2, ShieldCheck, Gauge];

const comparisonRows = [
  ['Availability', 'Can answer outside business hours', 'Usually follows a scheduled shift'],
  ['Response time', 'Can respond immediately when configured', 'Depends on workload and availability'],
  ['Parallel conversations', 'Can handle multiple chats at once', 'Handles a limited number at a time'],
  ['Consistency', 'Uses the same approved business information', 'Brings human context and adaptability'],
  ['Complex or sensitive cases', 'Escalates to a person', 'Uses judgement and empathy'],
  ['Relationships and decisions', 'Supports the first step', 'Builds trust and makes nuanced decisions'],
];

export default function HomePage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: BRAND.name,
        url: 'https://autonyxtech.in',
        email: BRAND.email,
        description: 'AI automation, business websites and lead capture for growing companies.',
      },
      ...siteConfig.services.map((service) => ({
        '@type': 'Service',
        name: service.title,
        description: service.description,
        provider: { '@type': 'Organization', name: BRAND.name },
      })),
      {
        '@type': 'FAQPage',
        mainEntity: siteConfig.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  };

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header />
      <main id="main-content" className="home-page">
        <section id="hero" className="hero-section" aria-labelledby="hero-title">
          <HeroBackgroundVideo />
          <div className="hero-content section-shell">
            <div className="hero-copy">
              <p className="hero-kicker"><span className="status-dot" />{siteConfig.hero.eyebrow}</p>
              <h1 id="hero-title">
                <span>AI agents that reply</span>
                <span>to every customer</span>
                <span>in seconds.</span>
              </h1>
              <p className="hero-description">{siteConfig.hero.description}</p>
              <div className="hero-actions">
                <BookCallButton>Book a call</BookCallButton>
                <ChatOpenButton className="button button-secondary">{siteConfig.hero.secondaryCta}</ChatOpenButton>
              </div>
              <div className="hero-proofline">
                <span><Check size={15} aria-hidden="true" /> Plain-language setup</span>
                <span><Check size={15} aria-hidden="true" /> Your team stays in control</span>
              </div>
            </div>
          </div>
          <a className="scroll-cue" href="#services"><span>Scroll to explore</span><ArrowDown size={15} aria-hidden="true" /></a>
        </section>

        <section id="services" className="services-section section-shell" aria-labelledby="services-title">
          <div className="section-heading services-heading">
            <div>
              <p className="eyebrow">What we build</p>
              <h2 id="services-title">Useful systems for the work that keeps coming back.</h2>
            </div>
            <p className="section-intro">From your first website to the everyday follow-up behind it, we make digital work easier for your customers and your team.</p>
          </div>
          <div className="services-layout">
            <div className="service-feature">
              <span className="service-feature-number">01 — 07</span>
              <span className="service-feature-icon"><Workflow size={28} aria-hidden="true" /></span>
              <h3>Less busywork. Better conversations.</h3>
              <p>Start with the problem, not the tool. We connect the right website, assistant or workflow to the way your business already works.</p>
              <BookCallButton className="text-link">Talk through a bottleneck</BookCallButton>
            </div>
            <div className="service-list">
              {siteConfig.services.map((service, index) => {
                const Icon = serviceIcons[index] ?? CircleHelp;
                return (
                  <article className="service-row" key={service.title}>
                    <span className="service-row-icon"><Icon size={18} strokeWidth={1.6} aria-hidden="true" /></span>
                    <div><h3>{service.title}</h3><p>{service.description}</p></div>
                    <span className="service-row-count">{String(index + 1).padStart(2, '0')}</span>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <PackagesPinned />

        <section id="agent" className="agent-section section-shell" aria-labelledby="agent-title">
          <div className="agent-intro">
            <div className="agent-emblem" aria-hidden="true"><Bot size={42} strokeWidth={1.2} /></div>
            <div>
              <p className="eyebrow">A practical AI assistant</p>
              <h2 id="agent-title">Helpful on the first reply. Human when it matters.</h2>
            </div>
          </div>
          <div className="agent-body">
            <div className="agent-description">
              <p>An AI assistant can take care of repetitive first-line questions at any hour and support multiple chats at once. It works alongside your team—not instead of the people who handle complex decisions and relationships.</p>
              <div className="agent-capabilities">
                {[
                  ['Knows your business', 'Answers from the services, process and FAQs you provide.'],
                  ['Takes a useful next step', 'Collects enquiry details and points people to the right contact.'],
                  ['Works with your team', 'Hands complex, sensitive or uncertain conversations to a person.'],
                ].map(([title, description]) => (
                  <article key={title}><span><Check size={16} aria-hidden="true" /></span><div><h3>{title}</h3><p>{description}</p></div></article>
                ))}
              </div>
            </div>
            <div className="comparison-wrap">
              <div className="comparison-heading"><span>Fair comparison</span><span>AI assistant</span><span>Your team</span></div>
              {comparisonRows.map(([label, agent, human]) => (
                <div className="comparison-row" key={label}>
                  <strong>{label}</strong><span>{agent}</span><span>{human}</span>
                </div>
              ))}
              <AgentCalculator />
            </div>
          </div>
        </section>

        <section className="process-section" aria-labelledby="process-title">
          <div className="section-shell process-layout">
            <div className="process-heading">
              <p className="eyebrow">How we work</p>
              <h2 id="process-title">A clear path from first conversation to launch.</h2>
              <p className="section-intro">Small, understandable steps. You stay close to the work and know what happens next.</p>
            </div>
            <ol className="process-list">
              {siteConfig.process.map((step, index) => (
                <li key={step.step}>
                  <span className="process-marker">{step.step}</span>
                  <div><h3>{step.title}</h3><p>{step.description}</p></div>
                  {index < siteConfig.process.length - 1 && <span className="process-connector" aria-hidden="true" />}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Re-enable this section when public case studies are ready.
        <section id="work" className="work-section section-shell" aria-labelledby="work-title">
          <div className="section-heading">
            <div><p className="eyebrow">Selected work</p><h2 id="work-title">Proof should be real, not decorative.</h2></div>
            <p className="section-intro">We only publish work when it can be shown accurately and with permission.</p>
          </div>
          <div className="work-empty">
            <span className="work-empty-mark"><Globe2 size={27} strokeWidth={1.4} aria-hidden="true" /></span>
            <div>
              <p className="eyebrow">Project examples</p>
              <h3>No public case studies are available yet.</h3>
              <p>Rather than invent client stories or results, we’ll share relevant examples directly when we talk about your needs.</p>
            </div>
            <BookCallButton className="button button-secondary">Discuss your project</BookCallButton>
          </div>
        </section>
        */}

        <section id="intro-hero" className="intro-hero-section" aria-labelledby="intro-hero-title">
          <div className="hero-atmosphere" aria-hidden="true">
            <div className="hero-grid" />
            <div className="hero-orb hero-orb-blue" />
            <div className="hero-orb hero-orb-cyan" />
          </div>
          <div className="hero-content section-shell">
            <div className="hero-copy">
              <p className="hero-kicker"><span className="status-dot" />{siteConfig.hero.eyebrow}</p>
              <h1 id="intro-hero-title">
                <span>AI agents that reply</span>
                <span>to every customer</span>
                <span>in seconds.</span>
              </h1>
              <p className="hero-description">{siteConfig.hero.description}</p>
              <div className="hero-actions">
                <BookCallButton>Book a call</BookCallButton>
                <ChatOpenButton className="button button-secondary">{siteConfig.hero.secondaryCta}</ChatOpenButton>
              </div>
              <div className="hero-proofline">
                <span><Check size={15} aria-hidden="true" /> Plain-language setup</span>
                <span><Check size={15} aria-hidden="true" /> Your team stays in control</span>
              </div>
            </div>
            <div className="hero-visual" aria-label="A preview of a customer chat assistant">
              <div className="visual-orbit visual-orbit-one" aria-hidden="true" />
              <div className="visual-orbit visual-orbit-two" aria-hidden="true" />
              <div className="visual-topline">
                <span><span className="status-dot" /> DEMONSTRATION</span>
                <span>AI ASSISTANT</span>
              </div>
              <HeroVideo />
              <ChatOpenButton className="demo-open">Try the live assistant</ChatOpenButton>
            </div>
          </div>
        </section>

        <section id="faq" className="faq-section section-shell" aria-labelledby="faq-title">
          <div className="faq-heading">
            <p className="eyebrow">Good questions</p>
            <h2 id="faq-title">Before we get started.</h2>
            <p className="section-intro">Straight answers about what the technology can—and cannot—do.</p>
          </div>
          <div className="faq-list">
            {siteConfig.faqs.map((faq, index) => (
              <details className="faq-item" key={faq.question}>
                <summary><span className="faq-number">{String(index + 1).padStart(2, '0')}</span><span>{faq.question}</span><ChevronDown size={18} aria-hidden="true" /></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="closing-section section-shell" aria-labelledby="closing-title">
          <div className="closing-orbit" aria-hidden="true" />
          <div>
            <p className="eyebrow">Start with a conversation</p>
            <h2 id="closing-title">Tell us what’s slowing your team down.</h2>
            <p>No pressure to know the answer yet. We’ll help you work out what is worth automating—and what should stay human.</p>
          </div>
          <div className="closing-actions">
            <BookCallButton>Book a call</BookCallButton>
            <Link className="text-link" href="/contact/">Or send us a note <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </section>
        <Footer />
      </main>
      <ChatWidget />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </>
  );
}
