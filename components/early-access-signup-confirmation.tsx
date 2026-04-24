'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Mail, Calendar } from 'lucide-react'
import Link from 'next/link'

interface EarlyAccessSignupConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail?: string
  userRole?: 'homeowner' | 'contractor'
}

export function EarlyAccessSignupConfirmation({
  open,
  onOpenChange,
  userEmail = '',
  userRole = 'homeowner',
}: EarlyAccessSignupConfirmationProps) {
  const roleText = userRole === 'contractor' ? 'contractor' : 'homeowner'
  const roleCapitalized = userRole === 'contractor' ? 'Contractor' : 'Homeowner'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mt-4">
            Welcome to Early Access!
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center space-y-6 py-6">
          {/* Success Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl animate-pulse" />
            <CheckCircle2 className="h-16 w-16 text-green-600 relative" />
          </div>

          {/* Confirmation Message */}
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">
              You're in, {roleCapitalized}!
            </p>
            <p className="text-sm text-muted-foreground">
              {userRole === 'contractor'
                ? 'Your founding contractor status is now active. Access exclusive opportunities and be featured on projects.'
                : 'Your early access is confirmed. Start posting projects and connecting with verified contractors today.'}
            </p>
          </div>

          {/* What's Next */}
          <div className="bg-primary/5 rounded-lg p-4 w-full text-left space-y-3 border border-primary/20">
            <p className="font-semibold text-sm text-foreground">What's next:</p>
            <div className="space-y-2">
              {userRole === 'contractor' ? (
                <>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary font-bold mt-0.5">1.</span>
                    <span>Complete your contractor profile to maximize visibility</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary font-bold mt-0.5">2.</span>
                    <span>Browse incoming projects in your dashboard</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary font-bold mt-0.5">3.</span>
                    <span>Submit competitive bids and win more work</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary font-bold mt-0.5">1.</span>
                    <span>Post your first home project</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary font-bold mt-0.5">2.</span>
                    <span>Receive bids from verified contractors</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary font-bold mt-0.5">3.</span>
                    <span>Compare quotes and make the best choice</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Email Confirmation */}
          {userEmail && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg p-3 w-full">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span>Confirmation sent to <span className="font-medium text-foreground">{userEmail}</span></span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-4">
          <Button
            asChild
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            <Link href={userRole === 'contractor' ? '/contractors/dashboard' : '/homeowners/projects'}>
              {userRole === 'contractor' ? 'Go to Dashboard' : 'Start Posting Projects'}
            </Link>
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Learn More
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
