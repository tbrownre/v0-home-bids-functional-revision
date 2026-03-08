"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Shield, Zap, Heart, MapPin, Star } from "lucide-react";
import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>

      {/* Hero */}
      <section className="border-b border-border px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div {...fadeInUp}>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">About HomeBids</p>
            <h1 className="text-balance text-4xl font-bold text-foreground sm:text-5xl">
              We Built the Marketplace That Homeowners and Contractors Actually Deserve
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              HomeBids was created to fix a broken process. Getting contractor quotes used to mean hours of phone calls, no-shows, and vague estimates. We changed that.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <h2 className="text-3xl font-bold text-foreground">Our Mission</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                HomeBids exists to make hiring a home contractor simple, transparent, and fair — for everyone involved.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Homeowners deserve real quotes from real professionals without the runaround. Contractors deserve direct access to homeowners who are ready to hire — without paying commissions on every job they win.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                We built a platform where both sides win.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: Users, label: "For Both Sides", desc: "Built equally for homeowners and contractors" },
                { icon: Shield, label: "Transparent Pricing", desc: "No hidden fees, no surprise commissions" },
                { icon: Zap, label: "Fast & Simple", desc: "Post a project in under 2 minutes" },
                { icon: Heart, label: "Local First", desc: "Connecting neighbors with trusted local pros" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-card p-5">
                  <item.icon className="mb-3 h-5 w-5 text-primary" />
                  <p className="font-semibold text-foreground text-sm">{item.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Problem We Solved */}
      <section className="border-y border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground">The Problem We Solved</h2>
            <p className="mt-4 text-muted-foreground">Getting contractor bids used to be painful on both sides.</p>
          </motion.div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="font-semibold text-foreground mb-4">For Homeowners</p>
              <ul className="space-y-3">
                {[
                  "Hours spent calling contractors",
                  "No-shows and unanswered messages",
                  "Vague estimates with no context",
                  "No easy way to compare quotes",
                  "Hiring someone without enough information",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-0.5 text-red-500 font-bold">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="font-semibold text-foreground mb-4">For Contractors</p>
              <ul className="space-y-3">
                {[
                  "Paying 20–40% commissions on every job",
                  "Competing with dozens on race-to-the-bottom sites",
                  "Wasting time on low-quality leads",
                  "No direct relationship with homeowners",
                  "Expensive marketing with no guarantee",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-0.5 text-red-500 font-bold">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-8 rounded-2xl bg-primary p-8 text-center">
            <p className="text-xl font-bold text-primary-foreground">HomeBids fixes all of this.</p>
            <p className="mt-2 text-primary-foreground/80 text-sm">One platform. Fair for everyone.</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold text-foreground">What We Stand For</h2>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Transparency",
                desc: "Clear pricing. No surprise fees. Homeowners see real bids. Contractors know exactly what they pay.",
              },
              {
                icon: MapPin,
                title: "Local Community",
                desc: "We believe in keeping home improvement dollars in local communities by connecting neighbors with nearby professionals.",
              },
              {
                icon: Star,
                title: "Fairness",
                desc: "Contractors keep 100% of what they earn. Homeowners get competitive quotes without pressure. Everyone wins.",
              },
            ].map((v) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <v.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-foreground">{v.title}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-primary px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold text-primary-foreground sm:text-4xl">
            Join the HomeBids Marketplace
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Whether you are a homeowner looking for quotes or a contractor looking for steady work, HomeBids was built for you.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/subscribe">
                Post a Project
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" asChild className="border-2 border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link href="/contractors">
                Join as a Contractor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      </main>
      <ScrollToTop />
    </div>
  );
}
