"use client";

import React from "react"

import { useState } from "react";
import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signUpContractor } from "@/lib/supabase/actions";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  User,
  Shield,
  Wrench,
  MapPin,
  Loader2,
} from "lucide-react";

type Step = "business" | "contact" | "credentials" | "services" | "review";

const serviceCategories = [
  "Roofing",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Garage Door",
  "Landscaping",
  "Painting",
  "Flooring",
  "Windows & Doors",
  "Kitchen & Bath",
  "Concrete & Masonry",
  "Siding",
  "Pest Control",
  "Appliance Repair",
  "Cleaning",
  "Home Security",
  "Pool & Spa",
  "Handyman",
  "Insulation",
  "Solar",
];

export default function ContractorSignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("business");
  const [formData, setFormData] = useState({
    // Business Info
    businessName: "",
    businessType: "",
    yearsInBusiness: "",
    numberOfEmployees: "",
    website: "",
    // Contact Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    businessAddress: "",
    city: "",
    state: "",
    zip: "",
    // Credentials
    licenseNumber: "",
    licenseState: "",
    insuranceProvider: "",
    insurancePolicyNumber: "",
    bondedAmount: "",
    // Services
    selectedServices: [] as string[],
    serviceAreas: "",
    minimumJobSize: "",
    maximumTravelDistance: "",
    bio: "",
    // Account
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const steps: { key: Step; label: string; icon: React.ElementType }[] = [
    { key: "business", label: "Business", icon: Building2 },
    { key: "contact", label: "Contact", icon: User },
    { key: "credentials", label: "Credentials", icon: Shield },
    { key: "services", label: "Services", icon: Wrench },
    { key: "review", label: "Review", icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const updateFormData = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(service)
        ? prev.selectedServices.filter((s) => s !== service)
        : [...prev.selectedServices, service],
    }));
  };

  const scrollToTop = () => {
    // Scroll both window and any scrollable parent to the top
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Also try scrolling the nearest scrollable container
    const scrollable = document.querySelector("main") || document.documentElement;
    if (scrollable && scrollable.scrollTop > 0) {
      scrollable.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const nextStep = () => {
    const stepOrder: Step[] = ["business", "contact", "credentials", "services", "review"];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
      scrollToTop();
    }
  };

  const prevStep = () => {
    const stepOrder: Step[] = ["business", "contact", "credentials", "services", "review"];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
      scrollToTop();
    }
  };

  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 8) {
      setSubmitError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    const result = await signUpContractor({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      businessName: formData.businessName,
      businessType: formData.businessType,
      yearsInBusiness: formData.yearsInBusiness,
      licenseNumber: formData.licenseNumber,
      licenseState: formData.licenseState,
      insuranceProvider: formData.insuranceProvider,
      bondedAmount: formData.bondedAmount,
      selectedServices: formData.selectedServices,
      serviceAreas: formData.serviceAreas,
      minimumJobSize: formData.minimumJobSize,
      bio: formData.bio,
    });
    setSubmitting(false);
    if (result.error) {
      setSubmitError(result.error);
      return;
    }
    router.push("/contractors/signup/pending");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
              Apply To Be Pro
            </h1>
            <p className="mt-3 text-muted-foreground">
              Complete your profile to start bidding on verified homeowner projects
            </p>
          </motion.div>

          {/* Progress Steps */}
          <div className="mb-10">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.key} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                        index <= currentStepIndex
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        index <= currentStepIndex ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`mx-2 h-0.5 flex-1 transition-colors ${
                        index < currentStepIndex ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <Card className="border-border">
            <CardContent className="p-6 sm:p-8">
              {/* Step 1: Business Information */}
              {currentStep === "business" && (
                <motion.div
                  key="business"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Business Information</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tell us about your company
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => updateFormData("businessName", e.target.value)}
                        placeholder="ABC Plumbing & Sons"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="businessType">Business Type *</Label>
                      <select
                        id="businessType"
                        value={formData.businessType}
                        onChange={(e) => updateFormData("businessType", e.target.value)}
                        className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select type...</option>
                        <option value="sole-proprietor">Sole Proprietor</option>
                        <option value="llc">LLC</option>
                        <option value="corporation">Corporation</option>
                        <option value="partnership">Partnership</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="yearsInBusiness">Years in Business *</Label>
                      <select
                        id="yearsInBusiness"
                        value={formData.yearsInBusiness}
                        onChange={(e) => updateFormData("yearsInBusiness", e.target.value)}
                        className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select...</option>
                        <option value="0-1">Less than 1 year</option>
                        <option value="1-3">1-3 years</option>
                        <option value="3-5">3-5 years</option>
                        <option value="5-10">5-10 years</option>
                        <option value="10+">10+ years</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="numberOfEmployees">Number of Employees</Label>
                      <select
                        id="numberOfEmployees"
                        value={formData.numberOfEmployees}
                        onChange={(e) => updateFormData("numberOfEmployees", e.target.value)}
                        className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select...</option>
                        <option value="1">Just me</option>
                        <option value="2-5">2-5</option>
                        <option value="6-10">6-10</option>
                        <option value="11-25">11-25</option>
                        <option value="25+">25+</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="website">Website (optional)</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => updateFormData("website", e.target.value)}
                        placeholder="https://www.yourcompany.com"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Contact Information */}
              {currentStep === "contact" && (
                <motion.div
                  key="contact"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Contact Information</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      How can homeowners reach you?
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => updateFormData("firstName", e.target.value)}
                        placeholder="John"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => updateFormData("lastName", e.target.value)}
                        placeholder="Smith"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData("email", e.target.value)}
                        placeholder="john@abcplumbing.com"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData("phone", e.target.value)}
                        placeholder="(512) 555-0123"
                        className="mt-1.5"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="businessAddress">Business Address *</Label>
                      <Input
                        id="businessAddress"
                        value={formData.businessAddress}
                        onChange={(e) => updateFormData("businessAddress", e.target.value)}
                        placeholder="123 Main Street"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => updateFormData("city", e.target.value)}
                        placeholder="Austin"
                        className="mt-1.5"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => updateFormData("state", e.target.value)}
                          placeholder="TX"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zip">ZIP Code *</Label>
                        <Input
                          id="zip"
                          value={formData.zip}
                          onChange={(e) => updateFormData("zip", e.target.value)}
                          placeholder="78701"
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Credentials */}
              {currentStep === "credentials" && (
                <motion.div
                  key="credentials"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Licenses & Insurance
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Help homeowners trust your business
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="licenseNumber">Contractor License Number</Label>
                      <Input
                        id="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={(e) => updateFormData("licenseNumber", e.target.value)}
                        placeholder="ABC-123456"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="licenseState">License State</Label>
                      <Input
                        id="licenseState"
                        value={formData.licenseState}
                        onChange={(e) => updateFormData("licenseState", e.target.value)}
                        placeholder="TX"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="insuranceProvider">Insurance Provider *</Label>
                      <Input
                        id="insuranceProvider"
                        value={formData.insuranceProvider}
                        onChange={(e) => updateFormData("insuranceProvider", e.target.value)}
                        placeholder="State Farm"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="insurancePolicyNumber">Policy Number *</Label>
                      <Input
                        id="insurancePolicyNumber"
                        value={formData.insurancePolicyNumber}
                        onChange={(e) => updateFormData("insurancePolicyNumber", e.target.value)}
                        placeholder="POL-789012"
                        className="mt-1.5"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="bondedAmount">Bonded Amount (if applicable)</Label>
                      <Input
                        id="bondedAmount"
                        value={formData.bondedAmount}
                        onChange={(e) => updateFormData("bondedAmount", e.target.value)}
                        placeholder="$50,000"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-secondary/50 p-4">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Why we ask:</strong> Verified credentials
                      help you stand out to homeowners and build trust. Contractors with verified
                      licenses and insurance win 40% more jobs.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Services */}
              {currentStep === "services" && (
                <motion.div
                  key="services"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Services & Coverage</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      What services do you offer and where?
                    </p>
                  </div>

                  <div>
                    <Label>Services Offered *</Label>
                    <p className="mb-3 text-sm text-muted-foreground">
                      Select all that apply
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {serviceCategories.map((service) => (
                        <label
                          key={service}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors ${
                            formData.selectedServices.includes(service)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-secondary/50"
                          }`}
                        >
                          <Checkbox
                            checked={formData.selectedServices.includes(service)}
                            onCheckedChange={() => toggleService(service)}
                          />
                          <span className="text-sm">{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="serviceAreas">Service Area ZIP Codes *</Label>
                      <Input
                        id="serviceAreas"
                        value={formData.serviceAreas}
                        onChange={(e) => updateFormData("serviceAreas", e.target.value)}
                        placeholder="78701, 78702, 78703, 78704"
                        className="mt-1.5"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Separate multiple ZIP codes with commas
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="minimumJobSize">Minimum Job Size</Label>
                      <select
                        id="minimumJobSize"
                        value={formData.minimumJobSize}
                        onChange={(e) => updateFormData("minimumJobSize", e.target.value)}
                        className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">No minimum</option>
                        <option value="100">$100+</option>
                        <option value="500">$500+</option>
                        <option value="1000">$1,000+</option>
                        <option value="5000">$5,000+</option>
                        <option value="10000">$10,000+</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="maximumTravelDistance">Maximum Travel Distance</Label>
                      <select
                        id="maximumTravelDistance"
                        value={formData.maximumTravelDistance}
                        onChange={(e) => updateFormData("maximumTravelDistance", e.target.value)}
                        className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select...</option>
                        <option value="10">10 miles</option>
                        <option value="25">25 miles</option>
                        <option value="50">50 miles</option>
                        <option value="100">100 miles</option>
                        <option value="unlimited">No limit</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="bio">About Your Business</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => updateFormData("bio", e.target.value)}
                        placeholder="Tell homeowners about your experience, specialties, and what makes your business unique..."
                        className="mt-1.5 min-h-[100px]"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Review */}
              {currentStep === "review" && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Review & Submit</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Please review your information and create your account
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="space-y-4">
                    <div className="rounded-lg border border-border p-4">
                      <h3 className="font-semibold text-foreground">Business Information</h3>
                      <div className="mt-2 grid gap-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Name:</span>{" "}
                          {formData.businessName || "Not provided"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Type:</span>{" "}
                          {formData.businessType || "Not provided"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Years in Business:</span>{" "}
                          {formData.yearsInBusiness || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-4">
                      <h3 className="font-semibold text-foreground">Contact Information</h3>
                      <div className="mt-2 grid gap-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Name:</span>{" "}
                          {formData.firstName} {formData.lastName}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Email:</span> {formData.email}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Phone:</span> {formData.phone}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Address:</span>{" "}
                          {formData.businessAddress}, {formData.city}, {formData.state}{" "}
                          {formData.zip}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-4">
                      <h3 className="font-semibold text-foreground">Services</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.selectedServices.length > 0 ? (
                          formData.selectedServices.map((service) => (
                            <span
                              key={service}
                              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                            >
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No services selected</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm">
                        <span className="text-muted-foreground">Service Areas:</span>{" "}
                        {formData.serviceAreas || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Account Creation */}
                  <div className="space-y-4 border-t border-border pt-6">
                    <h3 className="font-semibold text-foreground">Create Your Account</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => updateFormData("password", e.target.value)}
                          placeholder="Create a password"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                          placeholder="Confirm your password"
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    <label className="flex items-start gap-3">
                      <Checkbox
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) =>
                          updateFormData("agreeToTerms", checked as boolean)
                        }
                        className="mt-0.5"
                      />
                      <span className="text-sm text-muted-foreground">
                        I agree to the{" "}
                        <Link href="/terms" className="text-primary hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                        . I understand that HomeBids will verify my business information.
                      </span>
                    </label>
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 space-y-4 border-t border-border pt-6">
                {submitError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {submitError}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  {currentStepIndex > 0 ? (
                    <Button variant="outline" onClick={prevStep} disabled={submitting}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  ) : (
                    <Button variant="outline" asChild>
                      <Link href="/contractors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Cancel
                      </Link>
                    </Button>
                  )}

                  {currentStep === "review" ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={!formData.agreeToTerms || !formData.password || submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Complete Signup
                          <CheckCircle2 className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button onClick={nextStep}>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-center text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Verified Business</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Local Jobs Only</span>
            </div>
          </motion.div>
        </div>
      </main>

      <ScrollToTop />
    </div>
  );
}
