'use client';

import { X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { BookingForm } from '@/components/booking/BookingForm';
import { BRAND } from '@/content/site';

type BookingContextValue = {
  openBooking: (packageName?: string) => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used inside BookingProvider.');
  return context;
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [packageName, setPackageName] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const openBooking = useCallback((selectedPackage = '') => {
    setPackageName(selectedPackage);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <BookingContext.Provider value={{ openBooking }}>
      {children}
      <dialog
        ref={dialogRef}
        className="booking-dialog"
        aria-labelledby="booking-dialog-title"
        onClose={() => setIsOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="booking-dialog-inner">
          <div className="booking-dialog-head">
            <div>
              <p className="eyebrow">A conversation, not a sales pitch</p>
              <h2 id="booking-dialog-title">Book a call</h2>
              <p className="booking-dialog-description">
                Tell us what you’re looking to improve. We’ll review your request and confirm a time.
              </p>
              <p className="booking-dialog-response">No obligation · {BRAND.responseTime}</p>
            </div>
            <button className="icon-button" type="button" aria-label="Close booking form" onClick={() => dialogRef.current?.close()}>
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <BookingForm key={`${packageName}-${isOpen}`} initialPackage={packageName} />
        </div>
      </dialog>
    </BookingContext.Provider>
  );
}
