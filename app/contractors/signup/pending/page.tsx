"use client";

import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";
import { getContractorSmsLink } from "@/lib/sms-config";
import {
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  Camera,
  FileText,
  Sparkles,
} from "lucide-react";

const FIRST_JOB_SMS = getContractorSmsLink("Hi HomeBids, I want to build my first bid.");

export default function AccountReadyPage() {
  // sms: links can't reliably open from inside an iframe (the v0 preview), so
  // open in a new tab when framed and in the same tab otherwise.
  const handleTextFirstJob = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== "undefined" && window.self !== window.top) {
      e.preventDefault();
      window.open(FIRST_JOB_SMS, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isContractor isSignedIn />

      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Success */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="relative mx-auto mb-8">
              <div className="absolute inset-0 mx-auto h-32 w-32 rounded-full bg-green-500/20 blur-3xl" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-xl shadow-green-500/30"
              >
                <CheckCircle2 className="h-14 w-14 text-white" />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-foreground sm:text-4xl text-balance">
                Your HomeBids account is ready.
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground text-pretty">
                Text us your first job and we&apos;ll turn it into a professional bid you can
                review, edit, and send.
              </p>
            </motion.div>
          </motion.div>

          {/* Primary action card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="mt-10 border-primary/30 bg-primary/5">
              <CardContent className="p-6 text-center sm:p-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Button asChild size="lg" className="w-full gap-2 rounded-full font-semibold sm:w-auto">
                    <a href={FIRST_JOB_SMS} onClick={handleTextFirstJob}>
                      <MessageSquare className="h-5 w-5" />
                      Text My First Job
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-full gap-2 rounded-full bg-transparent font-semibold sm:w-auto"
                  >
                    <Link href="/contractors/dashboard">
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
                  Send job notes, photos, screenshots, or a rough scope. HomeBids will organize it
                  into a professional proposal.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* How it works */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 grid gap-4 sm:grid-cols-3"
          >
            {[
              {
                icon: MessageSquare,
                title: "1. Text the job",
                copy: "Send us the details however you have them — no forms to fill out.",
              },
              {
                icon: Sparkles,
                title: "2. We build the bid",
                copy: "HomeBids turns your notes into a clean, professional proposal.",
              },
              {
                icon: FileText,
                title: "3. Review & send",
                copy: "Edit anything, then share a link or PDF with your customer.",
              },
            ].map((s) => (
              <div key={s.title} className="rounded-xl border border-border bg-card p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.copy}</p>
              </div>
            ))}
          </motion.div>

          {/* Optional profile nudge — clearly secondary */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Camera className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Your account is ready. You can build bids now and finish your profile later.
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Add your logo, license, and business details anytime from your Account.
                  </p>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1">
                <Link href="/contractors/dashboard?tab=account">
                  Finish Profile
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      <ScrollToTop />
    </div>
  );
}
