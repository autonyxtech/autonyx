'use client';

import { MessageCircle } from 'lucide-react';

export function ChatOpenButton({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event('autonyx:chat-open'))}
    >
      <MessageCircle size={17} aria-hidden="true" />
      {children}
    </button>
  );
}
