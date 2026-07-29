import { SubscriptionGate } from "@/components/subscription-gate";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SubscriptionGate userType="contractor">{children}</SubscriptionGate>;
}
