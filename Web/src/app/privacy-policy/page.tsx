import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPolicyPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header />
      <main id="main-content" className="legal-page section-shell">
        <article className="legal-content">
          <p className="eyebrow">Legal information</p>
          <h1>Privacy policy</h1>
          <div>
            <p>This draft policy is intended as a starting point only and should be reviewed by a qualified legal professional before publication.</p>
            <p>We collect the information you provide when you contact us, ask questions through the website or chat assistant, or submit a form. This may include your name, email address, phone number, business details, and the message you send.</p>
            <p>We use this information to respond to enquiries, understand project needs, manage conversations, improve our service and send updates related to your request.</p>
            <p>We do not sell personal information. We store contact and lead data only as long as required to operate and improve support, or to fulfill a legitimate business need.</p>
            <p>We may use third-party services for email delivery, hosting, and analytics, and we will keep data handling aligned with reasonable security practices.</p>
            <p>If you want to ask about removal, correction or use of your information, contact us at hello@autonyx.tech.</p>
            <p><Link href="/contact/">Return to contact page</Link></p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
