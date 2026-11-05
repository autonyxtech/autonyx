import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header />
      <main id="main-content" className="legal-page section-shell">
        <article className="legal-content">
          <p className="eyebrow">Legal information</p>
          <h1>Terms of use</h1>
          <div>
            <p>This is a draft terms page and should be reviewed by a legal professional before publication.</p>
            <p>By using our website or contacting us, you agree that any information shared through the form or chatbot is for business discussion and may be used to respond to your enquiry.</p>
            <p>We provide website design, automation, AI support and related digital services in line with a project scope that is agreed in writing before work begins.</p>
            <p>We do not guarantee specific sales results, rankings, engagement level or conversion outcomes. We aim to deliver clear, well-built digital systems that improve communication and lead handling.</p>
            <p>Client responsibilities may include timely access to business information, feedback, content, approvals and domain access needed to complete the project.</p>
            <p>Any project or service agreement is subject to a separate written statement of work or proposal, if applicable.</p>
            <p><Link href="/contact/">Return to contact page</Link></p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
