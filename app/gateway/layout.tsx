import React from "react";
import type { Metadata } from "next";

// The gateway landing page manages its own layout — no global footer/header.
export default function GatewayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
