"use client";

import { Header } from "@/components/header";
import { getMockUser, USE_MOCK_DATA } from "@/lib/mock-auth";

export default function ProfilePage() {
  const user = USE_MOCK_DATA ? getMockUser() : null;
  const isContractor = user?.role === "contractor";

  return (
    <div className="flex min-h-screen flex-col">
      <Header isSignedIn={!isContractor} isContractor={isContractor} />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">Your Profile</h1>
        <p className="max-w-sm text-muted-foreground">
          Profile settings and account management coming soon.
        </p>
      </main>
    </div>
  );
}
