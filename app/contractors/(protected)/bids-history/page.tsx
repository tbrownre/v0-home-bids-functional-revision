"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ContractorProposalCard } from "@/components/proposal/contractor-proposal-card";
import { getContractorProposals, getContractorMarketplaceBids, type Proposal, type MarketplaceBid } from "@/lib/supabase/proposals";
import { MapPin, ChevronRight } from "lucide-react";
import { timeAgo } from "@/lib/proposal-format";

export default function BidsHistoryPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [marketplaceBids, setMarketplaceBids] = useState<MarketplaceBid[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const [proposalsResult, bidsResult] = await Promise.all([
          getContractorProposals(),
          getContractorMarketplaceBids(),
        ]);
        
        const proposalData = proposalsResult.proposals || [];
        const bidData = bidsResult.bids || [];

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
        setMarketplaceBids(bidData);
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
            <Link href="/contractors/dashboard">
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
        ) : proposals.length === 0 && marketplaceBids.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No bids yet.</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Build a bid by text and it will appear here.
            </p>
            <Button className="mt-4 rounded-full font-semibold" asChild>
              <a href="sms:+12832291348?&body=I%20want%20to%20build%20a%20new%20bid">Build a Bid</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hosted proposals */}
            {proposals.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Hosted Proposals</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {proposals.map((proposal) => (
                    <ContractorProposalCard key={proposal.id} proposal={proposal} />
                  ))}
                </div>
              </div>
            )}

            {/* Marketplace bids */}
            {marketplaceBids.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Marketplace Job Bids</h3>
                <div className="space-y-2">
                  {marketplaceBids.map((bid) => (
                    <div
                      key={bid.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30"
                    >
                      <div className="flex flex-1 flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="truncate font-medium text-foreground">{bid.jobs?.title || "Job"}</p>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              bid.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                            }`}
                          >
                            {bid.status === "pending" ? "Pending" : bid.status === "accepted" ? "Accepted" : bid.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {bid.jobs?.location && (
                            <>
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{bid.jobs.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <div className="text-right">
                          {bid.amount && <p className="font-semibold text-foreground">${bid.amount.toLocaleString()}</p>}
                          {bid.created_at && (
                            <p className="text-xs text-muted-foreground">{timeAgo(bid.created_at)}</p>
                          )}
                        </div>
                        {bid.jobs?.share_token && (
                          <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" asChild>
                            <a href={`/j/${bid.jobs.share_token}`}>
                              View <ChevronRight className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
