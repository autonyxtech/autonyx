import type { Metadata } from 'next';
import { Mail, MapPin, MessageCircleMore, PhoneCall } from 'lucide-react';
import { BookingForm } from '@/components/booking/BookingForm';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BRAND, contactDetails } from '@/content/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Tell Autonyx Technologies what you want to improve. Request a discovery call about websites, AI assistants and automation.',
  alternates: { canonical: '/contact/' },
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="contact-page section-shell">
        <div className="contact-layout">
          <section className="contact-copy" aria-labelledby="contact-title">
            <p className="eyebrow">Contact</p>
            <h1 id="contact-title">Let’s make the next step clear.</h1>
            <p>Tell us a little about your business and the work you want to make easier. We’ll help you explore a practical next step—without assuming AI is the answer to everything.</p>
            <div className="contact-details">
              <a href={`mailto:${contactDetails.email}`}><Mail size={17} aria-hidden="true" />{contactDetails.email}</a>
              <a href={`tel:${contactDetails.phone.replace(/[^\d+]/g, '')}`}><PhoneCall size={17} aria-hidden="true" />{contactDetails.phone}</a>
              <a href={BRAND.whatsappLink} target="_blank" rel="noreferrer"><MessageCircleMore size={17} aria-hidden="true" />Message us on WhatsApp</a>
              <span><MapPin size={17} aria-hidden="true" />Working with businesses across India.</span>
            </div>
            <p className="contact-note">Typical response: {contactDetails.responseTime}. Hours: {contactDetails.hours}.</p>
          </section>
          <section className="contact-form-wrap" aria-labelledby="contact-form-title">
            <p className="eyebrow">A few quick details</p>
            <h2 id="contact-form-title">Request a discovery call.</h2>
            <p>Three short steps. Your details are used to respond to this enquiry.</p>
            <BookingForm />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
