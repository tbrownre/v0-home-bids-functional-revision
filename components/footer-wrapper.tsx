'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/footer';

export function FooterWrapper() {
  const pathname = usePathname();
  
  // Don't render Footer on public share pages
  if (
    pathname.startsWith('/j/') ||
    pathname.startsWith('/pro/') ||
    pathname.startsWith('/c/') ||
    pathname.startsWith('/my/')
  ) {
    return null;
  }
  
  return <Footer />;
}
