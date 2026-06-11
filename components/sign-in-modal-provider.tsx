"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { SignInModal } from "@/components/sign-in-modal";

// ── Context ───────────────────────────────────────────────────────────────────

interface SignInModalContextValue {
  openSignIn: () => void;
}

const SignInModalContext = createContext<SignInModalContextValue>({
  openSignIn: () => {},
});

export function useSignInModal() {
  return useContext(SignInModalContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function SignInModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openSignIn = useCallback(() => setOpen(true), []);

  return (
    <SignInModalContext.Provider value={{ openSignIn }}>
      {children}
      <SignInModal
        open={open}
        onOpenChange={setOpen}
        onSignIn={() => setOpen(false)}
      />
    </SignInModalContext.Provider>
  );
}
