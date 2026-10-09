/**
 * ADLAND: Meta Pixel for the ad landing pages (server component — plain script tags render in the HTML so Meta's
 * pixel checker sees them). Renders nothing until NEXT_PUBLIC_META_PIXEL_ID is set in Vercel; GTM is optional via
 * NEXT_PUBLIC_GTM_ID. PageView fires on load; the CTA island fires Contact / OpenMessages with an eventID that the
 * Conversions API route reuses for de-duplication.
 */
export function MetaPixel() {
  const pixel = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "").replace(/\D/g, "");
  const gtm = (process.env.NEXT_PUBLIC_GTM_ID || "").replace(/[^A-Za-z0-9-]/g, "");
  if (!pixel && !gtm) return null;
  return (
    <>
      {pixel && (
        <>
          <script
            id="hb-meta-pixel"
            dangerouslySetInnerHTML={{
              __html:
                "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');" +
                `fbq('init','${pixel}');fbq('track','PageView');`,
            }}
          />
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${pixel}&ev=PageView&noscript=1`} />
          </noscript>
        </>
      )}
      {gtm && (
        <script
          id="hb-gtm"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`,
          }}
        />
      )}
    </>
  );
}
