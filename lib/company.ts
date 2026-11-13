/**
 * COMPANY — the one place the legal entity's public contact details live (A2P/10DLC review, Tim Nov 13 2026:
 * "Footer on every page: HomeBids LLC with phone and email, no street address; Contact page with the full details;
 * the mailing address is our registered agent address").
 *
 * Footer = legalName + phone + email only. /contact and the Privacy Policy = everything incl. the mailing address.
 */
export const COMPANY = {
  legalName: "HomeBids LLC",
  brand: "HomeBids",
  phoneDisplay: "(928) 706-9624",
  phoneE164: "+19287069624",
  email: "tim@homebids.ai",
  mailing: {
    line1: "4539 N 22nd St Ste R",
    city: "Phoenix",
    state: "AZ",
    zip: "85016",
  },
  website: "https://www.homebids.ai",
} as const;

export const COMPANY_MAILING_ONE_LINE = `${COMPANY.mailing.line1}, ${COMPANY.mailing.city}, ${COMPANY.mailing.state} ${COMPANY.mailing.zip}`;
