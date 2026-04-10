'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

const DISABLED_PIXEL_PATHS = new Set([
  '/estrategiafinancierausa',
  '/generaldeals3',
  '/generaldeals4',
  '/iul-en-qt',
  '/iul-generaldeals',
  '/iul-pagosenvida',
  '/iul-qt-tk',
  '/iul-qt-tt',
  '/iul-quotify',
  '/iul-quotify2',
  '/iul-webpagos',
  '/pagosenvida2',
  '/seguroparavida',
  '/segurosdesvida',
  '/segurosdesvida2',
  '/tab1',
  '/vidapro',
  '/web-pagos2',
])

function getMetaPixelId(pathname: string) {
  if (pathname === '/iul-3560-mc') {
    return '1532513301232175'
  }

  if (pathname === '/iul-en-qt') {
    return '4183928465176236'
  }

  return '980723860687387'
}

export default function PixelScripts() {
  const pathname = usePathname() || '/'

  if (DISABLED_PIXEL_PATHS.has(pathname)) {
    return null
  }

  const metaPixelId = getMetaPixelId(pathname)

  return (
    <>
      <Script id="meta-pixel-base" strategy="beforeInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${metaPixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <Script id="tiktok-pixel-base" strategy="beforeInteractive">
        {`
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
            ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
            ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
            for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
            ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
            ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");
            n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
            ttq.load('D35C49RC77U1VDRE0SV0');
            ttq.page();
          }(window, document, 'ttq');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
