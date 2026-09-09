import { test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/kofi/webhook/route.ts";

/**
 * The webhook endpoint itself: the wire format Ko-fi actually sends, and the
 * token check.
 *
 * Ko-fi posts application/x-www-form-urlencoded with one field, `data`,
 * holding a JSON string — not a JSON body. It also retries anything that is
 * not a 200 forever, so an outcome we have already recorded must answer 200.
 */

process.env.KOFI_VERIFICATION_TOKEN = "test-token-abc";

function post(fields: Record<string, string>): Request {
  const body = new URLSearchParams(fields);
  return new Request("https://example.test/api/kofi/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

function kofiBody(over: Record<string, unknown> = {}) {
  return JSON.stringify({
    verification_token: "test-token-abc",
    message_id: `wh-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    type: "Donation",
    is_public: true,
    from_name: "Jo",
    message: "keep going",
    amount: "5.00",
    url: "https://ko-fi.com/x",
    email: "jo@example.com",
    currency: "USD",
    is_subscription_payment: false,
    kofi_transaction_id: `tx-${Math.random().toString(36).slice(2)}`,
    ...over,
  });
}

test("a well-formed Ko-fi post is accepted", async () => {
  const res = await POST(post({ data: kofiBody() }));
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.ok, true);
  assert.equal(json.status, "recorded");
});

test("a redelivery of the same message id answers 200 as a duplicate", async () => {
  const data = kofiBody();
  assert.equal((await POST(post({ data }))).status, 200);
  const again = await POST(post({ data }));
  assert.equal(again.status, 200, "a non-200 would make Ko-fi retry forever");
  assert.equal((await again.json()).status, "duplicate");
});

test("a wrong verification token is refused", async () => {
  const res = await POST(post({ data: kofiBody({ verification_token: "wrong" }) }));
  assert.equal(res.status, 401);
});

test("a missing verification token is refused", async () => {
  const res = await POST(post({ data: kofiBody({ verification_token: undefined }) }));
  assert.equal(res.status, 401);
});

test("a token of a different length is refused without throwing", async () => {
  // timingSafeEqual throws on unequal lengths; the route must handle that.
  const res = await POST(post({ data: kofiBody({ verification_token: "short" }) }));
  assert.equal(res.status, 401);
});

test("a body with no data field is rejected and not retried", async () => {
  const res = await POST(post({ nonsense: "1" }));
  assert.equal(res.status, 400);
});

test("unparseable JSON in the data field is rejected and not retried", async () => {
  const res = await POST(post({ data: "{not json" }));
  assert.equal(res.status, 400, "retrying malformed JSON would never succeed");
});

test("a payload with no message id is rejected rather than retried", async () => {
  const res = await POST(
    post({ data: kofiBody({ message_id: undefined, kofi_transaction_id: undefined }) })
  );
  assert.equal(res.status, 400);
});

test("a JSON body instead of a form is rejected, not crashed on", async () => {
  const req = new Request("https://example.test/api/kofi/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: kofiBody(),
  });
  const res = await POST(req);
  assert.equal(res.status, 400);
});
