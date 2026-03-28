import { geolocation, ipAddress } from "@vercel/functions";
import { NextResponse } from "next/server";

type LeadPayload = {
  page?: string;
  answers?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LeadPayload | null;

  if (!body?.answers) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const webhookUrl = process.env.principal_webhook_url;
  const geo = geolocation(request);
  const cleanedAnswers = Object.fromEntries(
    Object.entries(body.answers).filter(([, value]) => value !== "" && value != null)
  );
  const payload = {
    submittedAt: new Date().toISOString(),
    source: "best-money-next",
    pagina: body.page || "home",
    ipAddress: ipAddress(request),
    geolocation: geo,
    ...cleanedAnswers,
  };

  if (!webhookUrl) {
    return NextResponse.json({
      ok: true,
      forwarded: false,
      saved: true,
      payload,
    });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

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
