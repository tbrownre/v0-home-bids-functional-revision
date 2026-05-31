"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/header";
import { getMockUser, mockSignOut, USE_MOCK_DATA, type MockUser } from "@/lib/mock-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User,
  MapPin,
  Bell,
  CreditCard,
  Shield,
  Trash2,
  Camera,
  CheckCircle2,
  Download,
  Smartphone,
  Mail,
  Key,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

// ── localStorage helpers ──────────────────────────────────────────────────────

const LS_PROFILE_KEY = "hb_mock_profile";

interface StoredProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
  photoDataUrl: string;
  notifs: {
    emailUpdates: boolean;
    smsUpdates: boolean;
    newBidAlerts: boolean;
    contractorMessages: boolean;
    projectStatus: boolean;
    marketing: boolean;
  };
  subStatus: "active" | "cancellation_scheduled";
}

function loadProfile(user: MockUser): StoredProfile {
  if (typeof window === "undefined") return defaultProfile(user);
  try {
    const raw = localStorage.getItem(LS_PROFILE_KEY);
    if (raw) return { ...defaultProfile(user), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultProfile(user);
}

function defaultProfile(user: MockUser): StoredProfile {
  return {
    firstName: user.firstName ?? "Sarah",
    lastName: user.lastName ?? "Johnson",
    email: user.email ?? "homeowner@homebids.demo",
    phone: user.phone ?? "(555) 867-5309",
    street: "1420 Harbor Blvd",
    unit: "",
    city: "Pasadena",
    state: "CA",
    zip: "91101",
    photoDataUrl: "",
    notifs: {
      emailUpdates: true,
      smsUpdates: true,
      newBidAlerts: true,
      contractorMessages: true,
      projectStatus: true,
      marketing: false,
    },
    subStatus: "active",
  };
}

function saveProfile(data: Partial<StoredProfile>) {
  if (typeof window === "undefined") return;
  try {
    const current = JSON.parse(localStorage.getItem(LS_PROFILE_KEY) ?? "{}");
    localStorage.setItem(LS_PROFILE_KEY, JSON.stringify({ ...current, ...data }));
  } catch { /* ignore */ }
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 shadow-lg text-sm font-medium text-foreground">
      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      {message}
    </div>
  );
}

// ── Section card wrapper ──────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-4.5 w-4.5 text-primary" aria-hidden />
        </div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);

  // Load user + profile from localStorage
  useEffect(() => {
    const u = USE_MOCK_DATA ? getMockUser() : null;
    setUser(u);
    if (u) setProfile(loadProfile(u));
  }, []);

  const showToast = (msg: string) => setToast(msg);

  if (!user || !profile) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header isSignedIn={false} isContractor={false} />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-muted-foreground">Please sign in to view your profile.</p>
          <Button asChild>
            <a href="/auth/sign-in">Sign In</a>
          </Button>
        </main>
      </div>
    );
  }

  if (user.role !== "homeowner") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header isSignedIn isContractor={user.role === "contractor"} />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-muted-foreground">This profile page is for homeowners only.</p>
        </main>
      </div>
    );
  }

  // ── Field update helpers ──────────────────────────────────────────────────

  const setField = <K extends keyof StoredProfile>(key: K, val: StoredProfile[K]) => {
    setProfile((prev) => prev ? { ...prev, [key]: val } : prev);
  };

  const setNotif = (key: keyof StoredProfile["notifs"], val: boolean) => {
    setProfile((prev) =>
      prev ? { ...prev, notifs: { ...prev.notifs, [key]: val } } : prev
    );
  };

  // ── Section handlers ──────────────────────────────────────────────────────

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setField("photoDataUrl", dataUrl);
      saveProfile({ photoDataUrl: dataUrl });
      showToast("Profile photo updated.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setField("photoDataUrl", "");
    saveProfile({ photoDataUrl: "" });
    showToast("Profile photo removed.");
  };

  const handleSavePersonal = () => {
    saveProfile({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
    });
    showToast("Personal info saved.");
  };

  const handleSaveAddress = () => {
    saveProfile({
      street: profile.street,
      unit: profile.unit,
      city: profile.city,
      state: profile.state,
      zip: profile.zip,
    });
    showToast("Address saved.");
  };

  const handleSaveNotifs = () => {
    saveProfile({ notifs: profile.notifs });
    showToast("Notification settings saved.");
  };

  const handleCancelSubscription = () => {
    setField("subStatus", "cancellation_scheduled");
    saveProfile({ subStatus: "cancellation_scheduled" });
    setShowCancelModal(false);
    showToast("Your subscription has been scheduled for cancellation.");
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    // Demo — just clear profile and sign out
    if (typeof window !== "undefined") {
      localStorage.removeItem(LS_PROFILE_KEY);
    }
    mockSignOut();
  };

  const handleDownloadData = () => {
    const data = JSON.stringify({ user, profile }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "homebids-profile-data.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Data downloaded.");
  };

  const authProviderLabel: Record<string, string> = {
    google: "Google",
    apple: "Apple",
    phone: "Phone (SMS)",
    email: "Email Magic Link",
    demo: "Demo Account",
  };

  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  const billingDateStr = nextBillingDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const initials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isSignedIn isContractor={false} />

      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Your Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your personal details, property info, notifications, billing, and account settings.
          </p>
        </div>

        <div className="flex flex-col gap-5">

          {/* 1. Profile Photo */}
          <Section icon={Camera} title="Profile Photo">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                {profile.photoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.photoDataUrl}
                    alt="Profile photo"
                    className="h-20 w-20 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border border-border text-xl font-bold text-primary select-none">
                    {initials}
                  </div>
                )}
              </div>
              {/* Actions */}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  className="w-fit"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {profile.photoDataUrl ? "Change Photo" : "Upload Photo"}
                </Button>
                {profile.photoDataUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePhoto}
                    className="w-fit text-muted-foreground hover:text-destructive"
                  >
                    Remove Photo
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  Demo mode: photo changes are saved locally for testing.
                </p>
              </div>
            </div>
          </Section>

          {/* 2. Personal Information */}
          <Section icon={User} title="Personal Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </div>
            </div>
            <Button className="mt-5" onClick={handleSavePersonal}>
              Save Personal Info
            </Button>
          </Section>

          {/* 3. Property Address */}
          <Section icon={MapPin} title="Property Address">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={profile.street}
                  onChange={(e) => setField("street", e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="unit">Unit / Suite (optional)</Label>
                <Input
                  id="unit"
                  placeholder="Apt, Suite, Unit…"
                  value={profile.unit}
                  onChange={(e) => setField("unit", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profile.city}
                  onChange={(e) => setField("city", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="CA"
                  maxLength={2}
                  value={profile.state}
                  onChange={(e) => setField("state", e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  placeholder="90001"
                  maxLength={10}
                  value={profile.zip}
                  onChange={(e) => setField("zip", e.target.value)}
                />
              </div>
            </div>
            <Button className="mt-5" onClick={handleSaveAddress}>
              Save Address
            </Button>
          </Section>

          {/* 4. Communication Preferences */}
          <Section icon={Bell} title="Communication Preferences">
            <div className="space-y-4">
              {(
                [
                  ["emailUpdates", "Email updates"],
                  ["smsUpdates", "SMS updates"],
                  ["newBidAlerts", "New bid alerts"],
                  ["contractorMessages", "Contractor message alerts"],
                  ["projectStatus", "Project status updates"],
                  ["marketing", "Marketing / promotional updates"],
                ] as [keyof StoredProfile["notifs"], string][]
              ).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={`notif-${key}`} className="cursor-pointer text-sm font-normal">
                    {label}
                  </Label>
                  <Switch
                    id={`notif-${key}`}
                    checked={profile.notifs[key]}
                    onCheckedChange={(val) => setNotif(key, val)}
                  />
                </div>
              ))}
            </div>
            <Button className="mt-5" onClick={handleSaveNotifs}>
              Save Notification Settings
            </Button>
          </Section>

          {/* 5. Payment Methods */}
          <Section icon={CreditCard} title="Payment Methods">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Visa ending in 4242</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Expires 12/27 &bull; Billing ZIP: 91101</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  Default
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Payment methods are mocked for demo testing.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddCardModal(true)}>
                Add Payment Method
              </Button>
              <Button variant="outline" size="sm" onClick={() => showToast("Card updated (demo).")}>
                Update Card
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => showToast("Card removed (demo).")}
              >
                Remove Card
              </Button>
            </div>
          </Section>

          {/* 6. Subscription */}
          <Section icon={ChevronRight} title="Subscription">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Homeowner Access — Free</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    HomeBids is completely free for homeowners.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Active
                </span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/new-job">Post a New Job</a>
              </Button>
            </div>
          </Section>

          {/* 7. Security & Login */}
          <Section icon={Shield} title="Security & Login">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Login method</p>
                    <p className="text-sm font-medium text-foreground">
                      {authProviderLabel[user.authProvider] ?? "Demo Account"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => showToast("Passkey setup (demo).")}>
                <Key className="mr-2 h-4 w-4" />
                Enable Passkey
              </Button>
              <Button variant="outline" size="sm" onClick={() => showToast("Change email (demo).")}>
                <Mail className="mr-2 h-4 w-4" />
                Change Email
              </Button>
              <Button variant="outline" size="sm" onClick={() => showToast("Change phone (demo).")}>
                <Smartphone className="mr-2 h-4 w-4" />
                Change Phone Number
              </Button>
            </div>
          </Section>

          {/* 8. Account Actions */}
          <Section icon={Trash2} title="Account Actions">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadData}>
                <Download className="mr-2 h-4 w-4" />
                Download My Data
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </Section>

        </div>
      </main>

      {/* ── Cancel subscription modal ───────────────────────────────────────── */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel your HomeBids subscription?</DialogTitle>
            <DialogDescription>
              {"You'll keep access until the end of your current billing period."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Keep Subscription
            </Button>
            <Button variant="destructive" onClick={handleCancelSubscription}>
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete account modal ────────────────────────────────────────────── */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete your account?
            </DialogTitle>
            <DialogDescription>
              This is a demo — your mock data and localStorage profile will be cleared and you will be signed out. No real data is deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Delete (Demo Reset)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add card modal (mock) ───────────────────────────────────────────── */}
      <Dialog open={showAddCardModal} onOpenChange={setShowAddCardModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Payment processing is mocked for demo testing. No real card data is stored.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Card Number</Label>
              <Input placeholder="4242 4242 4242 4242" disabled />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Expiry</Label>
                <Input placeholder="MM/YY" disabled />
              </div>
              <div className="space-y-1.5">
                <Label>CVC</Label>
                <Input placeholder="123" disabled />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCardModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowAddCardModal(false);
                showToast("Payment method added (demo).");
              }}
            >
              Add Card (Demo)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
