'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '')
).replace(/\/$/, '');

export function VisitTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.toLowerCase().replace(/\/$/, '') === '/autonyx') return;
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    fetch(`${API_URL}/api/v1/analytics/visit`, { method: 'POST', keepalive: true }).catch((error: unknown) => {
      console.error('Could not record website visit.', error);
    });
  }, [pathname]);

  return null;
}
