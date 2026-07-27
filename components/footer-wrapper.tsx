'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/footer';

export function FooterWrapper() {
  const pathname = usePathname();
  
  // Don't render Footer on public share pages
  if (pathname.startsWith('/j/') || pathname.startsWith('/pro/')) {
    return null;
  }
  
  return <Footer />;
}
