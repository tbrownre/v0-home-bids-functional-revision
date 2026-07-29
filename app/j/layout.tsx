import React from 'react';

/**
 * Layout for /j/[token] route.
 * Renders children without the global footer nav to keep the job page focused.
 * The job components provide their own minimal footer.
 */
export default function JobLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
