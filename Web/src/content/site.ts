export const BRAND = {
  name: 'Autonyx Technologies',
  shortName: 'Autonyx',
  domain: 'autonyx.tech',
  email: 'hello@autonyx.tech',
  phone: '+91 98765 43210',
  whatsappLink: 'https://wa.me/919876543210',
  startTime: 'Mon-Fri, 9:00 AM to 6:00 PM IST',
  responseTime: 'Usually within 1 business day',
};

export const siteConfig = {
  nav: [
    { label: 'Services', href: '#services' },
    { label: 'Packages', href: '#packages' },
    { label: 'AI Agent', href: '#agent' },
    { label: 'Work', href: '#work' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Contact', href: '/contact/' },
  ],
  hero: {
    eyebrow: 'AI automation for growing businesses',
    title: 'AI agents that reply to every customer in seconds.',
    description:
      'We build fast business websites and AI assistants that capture, qualify and follow up on enquiries, so your team talks only to people ready to buy.',
    primaryCta: 'Book a call',
    secondaryCta: 'Try the AI agent',
    demoPrompt: 'Ask our AI anything',
  },
  services: [
    {
      title: 'AI customer-support and sales agents',
      description: 'Answer common questions instantly, qualify new enquiries, and guide visitors to the next step without waiting for a human.',
    },
    {
      title: 'AI enquiry and lead capture',
      description: 'Collect names, contact details and needs on your website or WhatsApp, then route warm leads to the right person.',
    },
    {
      title: 'WhatsApp and web chat automation',
      description: 'Keep conversations moving across channels with consistent replies, quick handoff, and follow-up reminders.',
    },
    {
      title: 'Workflow and agentic automation',
      description: 'Set up repeatable follow-ups, document handling, scheduling, and internal Q&A over your business data.',
    },
    {
      title: 'Modern websites',
      description: 'Launch a polished, mobile-first website that makes it easy for people to understand your offer and contact you.',
    },
    {
      title: 'Hosting, monitoring and maintenance',
      description: 'Keep your website and automation supported with updates, monitoring, backups and practical help.',
    },
    {
      title: 'Analytics and reporting',
      description: 'See what visitors ask, where enquiries come from and which parts of the experience need attention.',
    },
  ],
  packages: [
    {
      name: 'Launch',
      blurb: 'A fast website that explains your offer clearly and turns visitors into enquiries.',
      includes: ['Design and build', 'Mobile-first pages', 'SEO basics', 'Lead form', 'Analytics setup', 'Domain deployment'],
      who: 'For service businesses that need a cleaner, more credible online presence.',
      price: 'Custom quote',
    },
    {
      name: 'AI Growth',
      blurb: 'Everything in Launch plus an AI support and sales agent trained on your business information.',
      includes: ['Lead capture and qualification', 'Website and WhatsApp replies', 'Team alerts', 'Monthly lead report', 'Business knowledge setup', 'Human handoff'],
      who: 'For businesses receiving regular enquiries that need faster reply times.',
      price: 'Custom quote',
    },
    {
      name: 'Run and Automate',
      blurb: 'Ongoing hosting, updates, and workflow automation that grows with your business.',
      includes: ['Hosting and monitoring', 'Backups and updates', 'Monthly tweaks', 'Follow-up automation', 'Document handling', 'Internal assistant setup'],
      who: 'For teams ready to automate repetitive work and support scale without hiring more staff.',
      price: 'Custom quote',
    },
  ],
  process: [
    { step: '01', title: 'Discover', description: 'We learn how you sell, who you serve, and what needs a faster response.' },
    { step: '02', title: 'Build', description: 'We design your site and automation in a focused first version.' },
    { step: '03', title: 'Launch', description: 'We go live on your domain with set-up, monitoring and clean handoff.' },
    { step: '04', title: 'Improve', description: 'We review what is working, fix the friction, and refine the flow.' },
  ],
  faqs: [
    { question: 'How long does a project usually take?', answer: 'Timing depends on the project scope, the integrations involved and how quickly business content and feedback are available. We agree on milestones before work begins.' },
    { question: 'Do I need technical knowledge?', answer: 'No. We handle the setup, deployment and training. You only need to share your business information and the flow you want to improve.' },
    { question: 'What data does the AI agent use?', answer: 'It uses the business information you provide: services, FAQs, process, pricing and common customer questions. It should never invent facts outside that context.' },
    { question: 'What if it gives a wrong answer?', answer: 'The system is designed with guardrails. It should answer clearly within the business context and hand off to a human for more complex or sensitive matters.' },
    { question: 'How does human handoff work?', answer: 'When the conversation needs a person, the AI can hand off with the customer context, contact details and requirement summary so your team can continue quickly.' },
    { question: 'Where is data stored?', answer: 'Data handling depends on the services chosen for a project. We explain the providers, storage location and retention approach before launch; we do not ask customers to share sensitive information in chat.' },
    { question: 'How is pricing structured?', answer: 'Pricing depends on scope, number of channels, ongoing support and automation needs. We keep it transparent and recommend the simplest setup that solves the bottleneck first.' },
    { question: 'Can it speak Hindi or Gujarati?', answer: 'Yes. The assistant can reply in English, Hindi or Gujarati when the conversation is clearly in that language and the information is available.' },
    { question: 'Can I cancel or pause the service?', answer: 'Yes. We keep the engagement simple and can pause, adjust or expand features as your needs change.' },
    { question: 'Do you integrate with WhatsApp?', answer: 'Yes. We can connect website chat and WhatsApp flows so the same lead capture and handoff process works across channels.' },
  ],
  footer: {
    legal: 'Your team handles the complex cases. The AI handles the first-line work around the clock.',
  },
};

export const TODO_REAL_DATA = [
  'Confirm the final brand name and legal business details.',
  'Add the final logo SVG and brand assets.',
  'Replace the demo hero video with a compressed production asset under 8 MB.',
  'Add real work screenshots and case-study content for the Selected Work section.',
  'Set final pricing for Launch, AI Growth and Run & Automate.',
  'Add final contact details, WhatsApp number and company policy links.'
];

export const socialLinks = [
  { label: 'Email', href: `mailto:${BRAND.email}` },
  { label: 'WhatsApp', href: BRAND.whatsappLink },
];

export const contactDetails = {
  email: BRAND.email,
  phone: BRAND.phone,
  hours: BRAND.startTime,
  responseTime: BRAND.responseTime,
};
