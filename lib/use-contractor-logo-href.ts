import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Hook that determines the correct href for the HomeBids logo based on login status.
 * Returns "/contractors/dashboard" if the signed-in user is a contractor or admin,
 * otherwise returns "/" (marketing homepage).
 * Defaults to "/" on any error.
 */
export function useContractorLogoHref(): string {
  const [href, setHref] = useState("/");

  useEffect(() => {
    async function determineHref() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user?.id) {
          setHref("/");
          return;
        }

        // Check if user is a contractor (user_type) or admin (is_admin)
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.user_type === "contractor") {
          // Also check if admin
          const { data: contractorProfile } = await supabase
            .from("contractor_profiles")
            .select("is_admin")
            .eq("id", user.id)
            .maybeSingle();

          if (profile.user_type === "contractor" || contractorProfile?.is_admin) {
            setHref("/contractors/dashboard");
            return;
          }
        }

        setHref("/");
      } catch (e) {
        console.error("[use-contractor-logo-href] Error determining href:", e);
        setHref("/");
      }
    }

    determineHref();
  }, []);

  return href;
}
