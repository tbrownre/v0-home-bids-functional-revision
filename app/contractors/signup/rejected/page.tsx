"use client";

import Link from "next/link";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";

export default function ContractorRejectedPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>

            <h1 className="mt-6 text-2xl font-semibold text-foreground">
              Application Not Approved
            </h1>
            <p className="mt-3 text-muted-foreground">
              Unfortunately, your contractor application was not approved at this time. This may be due to incomplete credentials, license verification, or service area restrictions.
            </p>

            <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-left">
              <p className="text-sm font-medium text-foreground">Common reasons for rejection:</p>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <li>- License number could not be verified</li>
                <li>- Insurance documentation was insufficient</li>
                <li>- Service area is not currently supported</li>
                <li>- Incomplete business information</li>
              </ul>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              You may reapply with updated credentials or{" "}
              <a href="mailto:support@homebids.com" className="font-medium text-primary hover:underline">
                contact support
              </a>{" "}
              to appeal this decision.
            </p>

            <div className="mt-8 flex flex-col gap-2">
              <Button asChild>
                <Link href="/contractors/signup">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reapply
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
