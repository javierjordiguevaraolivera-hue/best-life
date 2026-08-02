# Meta Pixel + CAPI Funnel Tracking

## Required event sequence

Tracking is progressive. Send one event whenever the visitor reaches a new step, always including every matching field collected so far:

1. Landing page → `PageView`
2. Next step → `ViewContent` with the data currently available
3. Every later step → another `ViewContent` with the accumulated data
4. Successful conversion → `Lead` with all available data

Example:

```text
PageView    → country/state detected
ViewContent → country/state + age
ViewContent → previous data + ZIP/city
ViewContent → previous data + first name/last name
ViewContent → previous data + phone/email, if a later step exists
Lead        → all collected data
```

## 1. Load the Meta Pixel once

Place the standard Meta Pixel HTML in the global layout and replace `PIXEL_ID`. It must only be installed once.

```html
<script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){
  n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
  s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
  (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'PIXEL_ID');
</script>
```

## 2. Use one function for Pixel + Meta CAPI

```js
function sendMetaEvent(eventName, step, data) {
  const eventId = `${eventName}_${crypto.randomUUID()}`;

  // Browser Pixel
  fbq('track', eventName, { step }, { eventID: eventId });

  // Server-side Meta CAPI
  navigator.sendBeacon('/api/facebook-events', new Blob([
    JSON.stringify({
      event: eventName,
      eventSourceUrl: location.href,
      payload: {
        funnel_id: 'iul-v4',
        event_id: eventId,
        step,
        country: data.country,
        state: data.state,
        zip_code: data.zip,
        city: data.city,
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phone,
        email: data.email
      }
    })
  ], { type: 'application/json' }));
}
```

## 3. Fire it on every step transition

```js
sendMetaEvent('PageView', 'landing', answers);

// Run after each successful “Next”:
sendMetaEvent('ViewContent', nextStep, answers);

// Run only after a successful conversion:
sendMetaEvent('Lead', 'completed', answers);
```

The server endpoint sends the event to:

```text
POST https://graph.facebook.com/{API_VERSION}/{PIXEL_ID}/events
```

It must normalize and SHA-256 hash `email`, `phone`, `first_name`, `last_name`, `city`, `state`, `zip_code`, `country`, and `external_id`. It should also send `_fbp`, `_fbc`, IP address, user agent, source URL, and the same `event_id` used by the browser Pixel. The shared `event_id` lets Meta deduplicate Pixel and CAPI copies.

## Existing project equivalents

- `app/pixel-scripts.tsx` loads the base Pixel.
- `app/iul-v4/page.tsx` creates the cumulative payload on every funnel step.
- `lib/gtm-events.ts` sends `PageView`, each `ViewContent`, and `Lead`.
- `app/api/facebook-events/route.ts` hashes the matching data and submits it to Meta CAPI.

Only include fields already known at the moment of the event. In the current funnel, phone and email are collected together on the final step, so they are fully available in `Lead`; they would appear in a later `ViewContent` only if another step followed.
