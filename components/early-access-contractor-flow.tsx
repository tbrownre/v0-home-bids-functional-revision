"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface EarlyAccessContractorFlowProps {
  onBack: () => void;
  onClose: () => void;
}

export function EarlyAccessContractorFlow({ onBack, onClose }: EarlyAccessContractorFlowProps) {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to the new founding contractor presale page
    router.push("/contractors/presale");
    onClose();
  }, [router, onClose]);

  // This component just handles the redirect, no UI rendered
  return null;
}
