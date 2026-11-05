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
    default: 'Autonyx Technologies | AI automation and business websites',
    template: '%s | Autonyx Technologies',
  },
  description: 'Practical AI assistants, business websites and workflow automation for growing companies.',
  metadataBase: new URL('https://autonyx.tech'),
  robots: { index: true, follow: true },
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
