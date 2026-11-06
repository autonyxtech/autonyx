import type { Metadata } from 'next';
import { Instrument_Sans, Unbounded } from 'next/font/google';
import { BookingProvider } from '@/components/layout/BookingProvider';
import { SmoothScroll } from '@/components/layout/SmoothScroll';
import { VisitTracker } from '@/components/layout/VisitTracker';
import './globals.css';

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const unbounded = Unbounded({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Autonyx Technologies | AI Websites & AI Chat Agents',
    template: '%s | Autonyx Technologies',
  },
  description: 'Autonyx Technologies builds AI-powered websites, chat agents and workflow automation to help growing businesses capture and respond to enquiries.',
  metadataBase: new URL('https://autonyxtech.in'),
  robots: { index: true, follow: true },
  icons: {
    icon: '/brand/logo.png',
    apple: '/brand/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${instrumentSans.variable} ${unbounded.variable}`}>
        <SmoothScroll>
          <VisitTracker />
          <BookingProvider>{children}</BookingProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
