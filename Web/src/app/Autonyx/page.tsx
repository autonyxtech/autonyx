import type { Metadata } from 'next';
import { InquiryDashboard } from '@/components/admin/InquiryDashboard';

export const metadata: Metadata = {
  title: 'Inquiry dashboard',
  robots: { index: false, follow: false },
};

export default function AutonyxAdminPage() {
  return <InquiryDashboard />;
}
