import { geolocation, ipAddress } from "@vercel/functions";
import { NextResponse } from "next/server";

type LandingVisitBody = {
  page?: string;
  visitedAt?: string;
  url?: unknown;
  referrer?: string | null;
  documentTitle?: string;
  browser?: Record<string, unknown>;
  device?: Record<string, unknown>;
  timezone?: string | null;
};

async function postWebhook(url: string, payload: unknown) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LandingVisitBody | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const webhookUrl = process.env.WBK_TEST_URL2?.trim();
  const geo = geolocation(request);
  const requestIp =
    ipAddress(request) ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  const payload = {
    submittedAt: new Date().toISOString(),
    source: "best-money-next",
    type: "landing_visit",
    ipAddress: requestIp,
    geolocation: geo,
    ...body,
  };

  if (!webhookUrl) {
    return NextResponse.json({
      ok: true,
      forwarded: false,
      payload,
    });
  }

  try {
    const response = await postWebhook(webhookUrl, payload);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Webhook rejected payload" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      forwarded: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Webhook request failed" },
      { status: 502 }
    );
  }
}
