"use client";

import { useState } from "react";
import { Header, type HeaderProps as BaseHeaderProps } from "./header";
import { EarlyAccessModal } from "./early-access-modal";

interface HeaderWithEarlyAccessProps extends Omit<BaseHeaderProps, "onEarlyAccess"> {}

export function HeaderWithEarlyAccess(props: HeaderWithEarlyAccessProps) {
  const [showEarlyAccess, setShowEarlyAccess] = useState(false);

  return (
    <>
      <Header {...props} onEarlyAccess={() => setShowEarlyAccess(true)} />
      <EarlyAccessModal open={showEarlyAccess} onOpenChange={setShowEarlyAccess} />
    </>
  );
}
