type LandingVisitPayload = {
  page: string;
  visitedAt: string;
  fbp: string | null;
  fbc: string | null;
  url: {
    href: string;
    origin: string;
    pathname: string;
    search: string;
    hash: string;
    queryString: string;
    params: Record<string, string>;
    paramsAll: Record<string, string[]>;
  };
  referrer: string | null;
  documentTitle: string;
  browser: {
    userAgent: string;
    language: string | null;
    languages: readonly string[];
    platform: string | null;
    cookieEnabled: boolean;
  };
  device: {
    viewportWidth: number | null;
    viewportHeight: number | null;
    screenWidth: number | null;
    screenHeight: number | null;
    devicePixelRatio: number | null;
  };
  timezone: string | null;
};

const META_COOKIE_RETRY_DELAY_MS = 250;
const META_COOKIE_MAX_RETRIES = 8;

function getCookieValue(name: string) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function buildFbcFromFbclid() {
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  if (!fbclid) return null;
  return `fb.1.${Date.now()}.${fbclid}`;
}

async function collectMetaCookies() {
  let fbp = getCookieValue("_fbp");
  let fbc = getCookieValue("_fbc");

  for (let attempt = 0; attempt < META_COOKIE_MAX_RETRIES; attempt += 1) {
    if (fbp && fbc) break;
    await wait(META_COOKIE_RETRY_DELAY_MS);
    fbp = fbp || getCookieValue("_fbp");
    fbc = fbc || getCookieValue("_fbc");
  }

  return {
    fbp,
    fbc: fbc || buildFbcFromFbclid(),
  };
}

async function buildLandingVisitPayload(page: string): Promise<LandingVisitPayload> {
  const searchParams = new URLSearchParams(window.location.search);
  const params: Record<string, string> = {};
  const paramsAll: Record<string, string[]> = {};
  const { fbp, fbc } = await collectMetaCookies();

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  Array.from(new Set(searchParams.keys())).forEach((key) => {
    paramsAll[key] = searchParams.getAll(key);
  });

  return {
    page,
    visitedAt: new Date().toISOString(),
    fbp,
    fbc,
    url: {
      href: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      queryString: window.location.search.replace(/^\?/, ""),
      params,
      paramsAll,
    },
    referrer: document.referrer || null,
    documentTitle: document.title,
    browser: {
      userAgent: navigator.userAgent,
      language: navigator.language || null,
      languages: navigator.languages || [],
      platform: navigator.platform || null,
      cookieEnabled: navigator.cookieEnabled,
    },
    device: {
      viewportWidth: window.innerWidth || null,
      viewportHeight: window.innerHeight || null,
      screenWidth: window.screen?.width ?? null,
      screenHeight: window.screen?.height ?? null,
      devicePixelRatio: window.devicePixelRatio || null,
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
  };
}

export function trackLandingVisit(page: string) {
  if (typeof window === "undefined") return;

  void buildLandingVisitPayload(page)
    .then((payload) =>
      fetch("/api/landing-visit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        keepalive: true,
      })
    )
    .catch(() => {
      // Tracking fallback is intentionally silent.
    });
}
