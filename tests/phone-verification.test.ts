import assert from "node:assert/strict";
import test from "node:test";
import { normalizeUsPhone } from "../lib/phone.ts";
import {
  createPhoneVerificationToken,
  validateLeadPhoneVerification,
  validatePhoneVerificationToken,
  verifyPhoneWithVeriphone,
  type VeriphoneResponse,
} from "../lib/phone-verification.ts";

process.env.VERIPHONE_API_KEY = "test-veriphone-api-key";
process.env.PHONE_VERIFICATION_SECRET = "test-phone-verification-secret-with-32-characters";

const validResponse: VeriphoneResponse = {
  status: "success",
  phone_valid: true,
  phone_type: "mobile",
  phone_region: "Florida",
  country: "United States",
  country_code: "US",
  e164: "+13055551234",
  carrier: "Example Carrier",
};

function response(body: VeriphoneResponse, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function verifyWith(body: VeriphoneResponse, phone: unknown = "3055551234") {
  return verifyPhoneWithVeriphone(phone, {
    fetchImpl: async () => response(body),
  });
}

test("normalizes national, formatted and +1 U.S. numbers without truncating invalid lengths", () => {
  assert.equal(normalizeUsPhone("3055551234"), "3055551234");
  assert.equal(normalizeUsPhone("(305) 555-1234"), "3055551234");
  assert.equal(normalizeUsPhone("1 305 555 1234"), "3055551234");
  assert.equal(normalizeUsPhone("305555123456"), "305555123456");
  assert.equal(normalizeUsPhone("23055551234"), "23055551234");
});

test("rejects phone numbers that do not normalize to exactly 10 digits", async () => {
  assert.deepEqual((await verifyWith(validResponse, "305555123")).flags, ["invalid_length"]);
  assert.deepEqual((await verifyWith(validResponse, "305555123456")).flags, ["invalid_length"]);
  assert.deepEqual((await verifyWith(validResponse, "23055551234")).flags, ["invalid_length"]);
});

test("accepts mobile, fixed_line and fixed_line_or_mobile", async () => {
  for (const phoneType of ["mobile", "fixed_line", "fixed_line_or_mobile"]) {
    const result = await verifyWith({ ...validResponse, phone_type: phoneType });
    assert.equal(result.isValid, true);
    assert.equal(result.veriphone?.phoneType, phoneType);
  }
});

test("rejects invalid, VoIP, carrierless, unknown-carrier and non-U.S. responses", async () => {
  assert.ok((await verifyWith({ ...validResponse, phone_valid: false })).flags.includes("veriphone_invalid_phone"));
  assert.ok((await verifyWith({ ...validResponse, phone_type: "voip" })).flags.includes("veriphone_disallowed_phone_type"));
  assert.ok((await verifyWith({ ...validResponse, carrier: "" })).flags.includes("veriphone_unknown_carrier"));
  assert.ok((await verifyWith({ ...validResponse, carrier: "unknown" })).flags.includes("veriphone_unknown_carrier"));
  assert.ok((await verifyWith({ ...validResponse, country_code: "CA", country: "Canada" })).flags.includes("veriphone_not_us"));
});

test("reports missing configuration and provider failures safely", async () => {
  const apiKey = process.env.VERIPHONE_API_KEY;
  delete process.env.VERIPHONE_API_KEY;
  const notConfigured = await verifyPhoneWithVeriphone("3055551234");
  assert.deepEqual(notConfigured.flags, ["veriphone_not_configured"]);
  process.env.VERIPHONE_API_KEY = apiKey;

  const failed = await verifyPhoneWithVeriphone("3055551234", {
    fetchImpl: async () => {
      throw new Error("network error");
    },
  });
  assert.deepEqual(failed.flags, ["veriphone_request_failed"]);

  const timedOut = await verifyPhoneWithVeriphone("3055551234", {
    timeoutMs: 1,
    fetchImpl: (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      }),
  });
  assert.deepEqual(timedOut.flags, ["veriphone_request_failed"]);
});

test("rejects altered, expired and wrong-phone tokens", () => {
  const issuedAt = 1_000_000;
  const token = createPhoneVerificationToken("3055551234", issuedAt);
  assert.ok(token);
  assert.equal(validatePhoneVerificationToken(token, "3055551234", issuedAt + 1), true);
  assert.equal(validatePhoneVerificationToken(`${token}x`, "3055551234", issuedAt + 1), false);
  assert.equal(validatePhoneVerificationToken(token, "3055559999", issuedAt + 1), false);
  assert.equal(validatePhoneVerificationToken(token, "3055551234", issuedAt + 15 * 60 * 1000), false);
});

test("final lead validation requires matching evidence and token", () => {
  const issuedAt = 1_000_000;
  const token = createPhoneVerificationToken("3055551234", issuedAt);
  const verification = {
    normalized: "3055551234",
    phoneValid: true as const,
    phoneType: "mobile" as const,
    carrier: "Example Carrier",
    countryCode: "US",
    country: "United States",
    e164: "+13055551234",
    phoneRegion: "Florida",
  };

  assert.equal(validateLeadPhoneVerification({
    phone: "3055551234",
    verificationToken: token,
    verification,
    now: issuedAt + 1,
  }).isValid, true);
  assert.ok(validateLeadPhoneVerification({
    phone: "3055559999",
    verificationToken: token,
    verification,
    now: issuedAt + 1,
  }).flags.includes("veriphone_phone_mismatch"));
});
