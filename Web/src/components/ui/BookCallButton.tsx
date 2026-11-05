'use client';

import { ArrowRight } from 'lucide-react';
import { useBooking } from '@/components/layout/BookingProvider';

export function BookCallButton({
  children = 'Book a call',
  packageName,
  className = 'button button-primary',
}: {
  children?: React.ReactNode;
  packageName?: string;
  className?: string;
}) {
  const { openBooking } = useBooking();
  return (
    <button className={className} type="button" onClick={() => openBooking(packageName)}>
      {children} <ArrowRight size={16} aria-hidden="true" />
    </button>
  );
}
