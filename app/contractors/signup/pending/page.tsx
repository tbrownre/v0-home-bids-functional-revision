"use client";

import React from "react"

import { useState } from "react";
import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  Mail,
  FileText,
  Shield,
  ArrowRight,
  HelpCircle,
  Send,
  MessageCircle,
} from "lucide-react";

export default function ApplicationPendingPage() {
  const [showContact, setShowContact] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  const resetContactForm = () => {
    setContactName("");
    setContactEmail("");
    setContactMessage("");
    setContactSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Success Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Animated Icon */}
            <div className="relative mx-auto mb-8">
              <div className="absolute inset-0 mx-auto h-32 w-32 rounded-full bg-amber-500/20 blur-3xl" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-500/30"
              >
                <Clock className="h-14 w-14 text-white" />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
                Application Submitted!
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Thank you for applying to become a HomeBids Pro. Your application is now under review.
              </p>
            </motion.div>
          </motion.div>

          {/* What to Expect Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="mt-10 border-border">
              <CardContent className="p-6 sm:p-8">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
                  What to Expect
                </h2>

                <div className="mt-6 space-y-6">
                  {/* Timeline */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Review Timeline</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        On average, we approve or decline applications within <strong className="text-foreground">24 hours</strong>. During busy periods, it may take up to 48 hours.
                      </p>
                    </div>
                  </div>

                  {/* Verification */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Verification Process</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        We verify your business information, licenses, and insurance to ensure quality for our homeowners. This helps you stand out as a trusted professional.
                      </p>
                    </div>
                  </div>

                  {/* Email Notification */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Email Notification</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        You&apos;ll receive an email at the address you provided once your application has been reviewed. Check your spam folder if you don&apos;t see it.
                      </p>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Once Approved</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        You&apos;ll gain access to your contractor dashboard where you can browse and bid on verified homeowner projects in your service area.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status Box */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-800">Application Status: Pending Review</p>
                  <p className="text-sm text-amber-700">Submitted just now</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center"
          >
            <Button asChild size="lg">
              <Link href="/">
                Return Home
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="bg-transparent">
              <Link href="/contractors">
                <HelpCircle className="mr-2 h-4 w-4" />
                Learn More About HomeBids Pro
              </Link>
            </Button>
          </motion.div>

          {/* Contact Support */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-10 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Have questions about your application?{" "}
              <button
                type="button"
                onClick={() => setShowContact(true)}
                className="text-primary hover:underline font-medium"
              >
                Contact our support team
              </button>
            </p>
          </motion.div>
        </div>
      </main>

      {/* Contact Support Modal */}
      <Dialog open={showContact} onOpenChange={(open) => {
        setShowContact(open);
        if (!open) resetContactForm();
      }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          {!contactSubmitted ? (
            <>
              <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pt-8 pb-6">
                <DialogHeader className="relative">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                    <MessageCircle className="h-7 w-7 text-primary" />
                  </div>
                  <DialogTitle className="text-center text-xl font-semibold">
                    Contact Support
                  </DialogTitle>
                  <DialogDescription className="text-center text-muted-foreground">
                    Have questions about your application? We are here to help.
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="px-6 pb-6">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="support-name" className="text-sm font-medium">Name</Label>
                    <Input
                      id="support-name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Your name"
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="support-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-message" className="text-sm font-medium">Message</Label>
                    <Textarea
                      id="support-message"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Tell us about your question or concern..."
                      className="min-h-[100px]"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 gap-2"
                    disabled={!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                    Send Message
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Message Sent</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Our support team will get back to you within 24 hours. Check your email for a response.
              </p>
              <Button
                className="mt-6"
                onClick={() => setShowContact(false)}
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ScrollToTop />
    </div>
  );
}
