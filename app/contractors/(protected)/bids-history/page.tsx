"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ContractorProposalCard } from "@/components/proposal/contractor-proposal-card";
import { getContractorProposals, type Proposal } from "@/lib/supabase/proposals";

export default function BidsHistoryPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const proposalsResult = await getContractorProposals();
        const proposalData = proposalsResult.proposals || [];

        // Sort proposals by last_viewed_at descending (nulls last), then updated_at descending
        const sortedProposals = (proposalData).sort((a, b) => {
          const aViewed = a.last_viewed_at ? new Date(a.last_viewed_at).getTime() : -1;
          const bViewed = b.last_viewed_at ? new Date(b.last_viewed_at).getTime() : -1;

          if (aViewed !== bViewed) {
            return bViewed - aViewed;
          }

          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });

        setProposals(sortedProposals);
      } catch (e) {
        console.error("[BidsHistory] Failed to load data:", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button and header */}
        <div className="mb-8 flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/contractors/dashboard?tab=overview">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Your Bids</h1>
        </div>

        {/* Content */}
        {loading ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">Loading bids…</p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No bids yet.</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Build a bid by text and it will appear here.
            </p>
            <Button className="mt-4 rounded-full font-semibold" asChild>
              <a href="sms:+12832291348?body=I%20want%20to%20build%20a%20new%20bid">Build a Bid</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Hosted Proposals</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {proposals.map((proposal) => (
                  <ContractorProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
