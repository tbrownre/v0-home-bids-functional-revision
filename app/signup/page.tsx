"use client";

import React from "react"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Home,
  Bell,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Shield,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Header } from "@/components/header";

type Step = "account" | "address" | "preferences" | "complete";

interface FormData {
  // Account
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  // Address
  address: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
  propertyType: string;
  ownershipStatus: string;
  // Preferences
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  preferredContactMethod: string;
  preferredContactTime: string;
}

const propertyTypes = [
  "Single Family Home",
  "Townhouse",
  "Condo",
  "Multi-Family",
  "Mobile Home",
  "Commercial Property",
  "Other",
];

const ownershipStatuses = [
  "Homeowner",
  "Investor",
  "Property Manager",
  "Renter (with landlord permission)",
];

const contactMethods = ["Email", "Phone", "Text Message"];

const contactTimes = [
  "Morning (8am - 12pm)",
  "Afternoon (12pm - 5pm)",
  "Evening (5pm - 8pm)",
  "Anytime",
];

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState<Step>("account");
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    unit: "",
    city: "",
    state: "",
    zip: "",
    propertyType: "",
    ownershipStatus: "",
    emailNotifications: true,
    smsNotifications: true,
    marketingEmails: false,
    preferredContactMethod: "Text Message",
    preferredContactTime: "Anytime",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: "account", label: "Account", icon: <User className="h-4 w-4" /> },
    { id: "address", label: "Property", icon: <Home className="h-4 w-4" /> },
    { id: "preferences", label: "Preferences", icon: <Bell className="h-4 w-4" /> },
    { id: "complete", label: "Complete", icon: <CheckCircle2 className="h-4 w-4" /> },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleCheckboxChange = (field: keyof FormData) => (checked: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: checked }));
  };

  const isAccountValid =
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.email.trim() &&
    formData.phone.trim() &&
    formData.password.trim() &&
    formData.confirmPassword.trim() &&
    formData.password === formData.confirmPassword &&
    formData.password.length >= 8;

  const isAddressValid =
    formData.address.trim() &&
    formData.city.trim() &&
    formData.state.trim() &&
    formData.zip.trim() &&
    formData.propertyType &&
    formData.ownershipStatus;

  const handleNext = () => {
    if (currentStep === "account" && isAccountValid) {
      setCurrentStep("address");
    } else if (currentStep === "address" && isAddressValid) {
      setCurrentStep("preferences");
    } else if (currentStep === "preferences" && agreedToTerms) {
      setCurrentStep("complete");
    }
  };

  const handleBack = () => {
    if (currentStep === "address") {
      setCurrentStep("account");
    } else if (currentStep === "preferences") {
      setCurrentStep("address");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header backHref="/" backLabel="Back" />

      <main className="mx-auto max-w-2xl px-4 py-12">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      index < currentStepIndex
                        ? "border-primary bg-primary text-primary-foreground"
                        : index === currentStepIndex
                          ? "border-primary bg-background text-primary"
                          : "border-muted bg-background text-muted-foreground"
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      index <= currentStepIndex
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 transition-colors ${
                      index < currentStepIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Account Information */}
          {currentStep === "account" && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-3xl font-semibold text-foreground">
                  Create your account
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Get started with HomeBids and connect with local contractors
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-8">
                <div className="grid gap-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleInputChange("firstName")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Smith"
                        value={formData.lastName}
                        onChange={handleInputChange("lastName")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={handleInputChange("email")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        className="pl-10"
                        value={formData.phone}
                        onChange={handleInputChange("phone")}
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Min. 8 characters"
                        value={formData.password}
                        onChange={handleInputChange("password")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange("confirmPassword")}
                      />
                    </div>
                  </div>

                  {formData.password &&
                    formData.confirmPassword &&
                    formData.password !== formData.confirmPassword && (
                      <p className="text-sm text-destructive">
                        Passwords do not match
                      </p>
                    )}

                  {formData.password &&
                    formData.password.length < 8 && (
                      <p className="text-sm text-destructive">
                        Password must be at least 8 characters
                      </p>
                    )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  disabled={!isAccountValid}
                  className="gap-2"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Property Address */}
          {currentStep === "address" && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-3xl font-semibold text-foreground">
                  Your property details
                </h1>
                <p className="mt-2 text-muted-foreground">
                  This helps us match you with contractors in your area
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-8">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="address"
                        placeholder="123 Main Street"
                        className="pl-10"
                        value={formData.address}
                        onChange={handleInputChange("address")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Apt / Suite / Unit (Optional)</Label>
                    <Input
                      id="unit"
                      placeholder="Apt 4B"
                      value={formData.unit}
                      onChange={handleInputChange("unit")}
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="San Francisco"
                        value={formData.city}
                        onChange={handleInputChange("city")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        placeholder="CA"
                        value={formData.state}
                        onChange={handleInputChange("state")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        placeholder="94102"
                        value={formData.zip}
                        onChange={handleInputChange("zip")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Property Type</Label>
                    <select
                      id="propertyType"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={formData.propertyType}
                      onChange={handleInputChange("propertyType")}
                    >
                      <option value="">Select property type...</option>
                      {propertyTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownershipStatus">I am a...</Label>
                    <select
                      id="ownershipStatus"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={formData.ownershipStatus}
                      onChange={handleInputChange("ownershipStatus")}
                    >
                      <option value="">Select your role...</option>
                      {ownershipStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack} className="gap-2 bg-transparent">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!isAddressValid}
                  className="gap-2"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {currentStep === "preferences" && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-3xl font-semibold text-foreground">
                  Your preferences
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Customize how you want to receive updates and communicate
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-8">
                <div className="grid gap-8">
                  {/* Notification Preferences */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-foreground">
                      Notification Preferences
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="emailNotifications"
                          checked={formData.emailNotifications}
                          onCheckedChange={handleCheckboxChange("emailNotifications")}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor="emailNotifications"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Email notifications
                          </label>
                          <p className="text-sm text-muted-foreground">
                            Receive updates about bids and messages via email
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="smsNotifications"
                          checked={formData.smsNotifications}
                          onCheckedChange={handleCheckboxChange("smsNotifications")}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor="smsNotifications"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            SMS notifications
                          </label>
                          <p className="text-sm text-muted-foreground">
                            Get text alerts for new bids and important updates
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="marketingEmails"
                          checked={formData.marketingEmails}
                          onCheckedChange={handleCheckboxChange("marketingEmails")}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor="marketingEmails"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Marketing emails
                          </label>
                          <p className="text-sm text-muted-foreground">
                            Receive tips, promotions, and seasonal reminders
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Preferences */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-foreground">
                      Contact Preferences
                    </h3>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="preferredContactMethod">
                          Preferred contact method
                        </Label>
                        <select
                          id="preferredContactMethod"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={formData.preferredContactMethod}
                          onChange={handleInputChange("preferredContactMethod")}
                        >
                          {contactMethods.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="preferredContactTime">
                          Best time to contact
                        </Label>
                        <select
                          id="preferredContactTime"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={formData.preferredContactTime}
                          onChange={handleInputChange("preferredContactTime")}
                        >
                          {contactTimes.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="space-y-4 border-t border-border pt-6">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) =>
                          setAgreedToTerms(checked as boolean)
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="terms"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I agree to the Terms of Service and Privacy Policy
                        </label>
                        <p className="text-sm text-muted-foreground">
                          By creating an account, you agree to our{" "}
                          <a href="#" className="text-primary hover:underline">
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a href="#" className="text-primary hover:underline">
                            Privacy Policy
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 p-4">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Your information is secure and will never be shared without
                  your permission
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack} className="gap-2 bg-transparent">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!agreedToTerms}
                  className="gap-2"
                >
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === "complete" && (
            <div className="space-y-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }}
                className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100"
              >
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </motion.div>

              <div>
                <h1 className="text-3xl font-semibold text-foreground">
                  Welcome to HomeBids!
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Your account has been created successfully
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-8">
                <h3 className="font-medium text-foreground">What happens next?</h3>
                <div className="mt-6 grid gap-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Post your first job
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Describe your project and upload photos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Receive bids</p>
                      <p className="text-sm text-muted-foreground">
                        Local contractors will submit competitive bids
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Choose and connect
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Review bids and approve your preferred contractor
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg">
                  <Link href="/">
                    Post Your First Job
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild size="lg" className="bg-transparent">
                  <Link href="/">Go to Dashboard</Link>
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
      <ScrollToTop />
    </div>
  );
}
