import assert from "node:assert/strict";
import test from "node:test";

import { readApiResponse } from "../lib/api-response.ts";

test("returns a successful JSON object", async () => {
  const response = new Response(JSON.stringify({ bookingId: "booking-1" }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });

  assert.deepEqual(await readApiResponse(response, "Booking failed.", ["bookingId"]), {
    bookingId: "booking-1",
  });
});

test("uses a server error message when it is usable", async () => {
  const response = new Response(JSON.stringify({ error: "Gaadhigu ma bannaana." }), {
    status: 409,
    headers: { "Content-Type": "application/json" },
  });

  await assert.rejects(
    readApiResponse(response, "Booking failed."),
    /Gaadhigu ma bannaana\./,
  );
});

test("uses the action fallback for malformed or non-object responses", async () => {
  const malformed = new Response("<html>Service unavailable</html>", { status: 503 });
  const unexpected = new Response(JSON.stringify(["not", "an", "object"]), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  await assert.rejects(readApiResponse(malformed, "Booking failed."), /Booking failed\./);
  await assert.rejects(readApiResponse(unexpected, "Booking failed."), /Booking failed\./);
});

test("does not expose non-string server error details", async () => {
  const response = new Response(JSON.stringify({ error: { debug: "internal" } }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });

  await assert.rejects(readApiResponse(response, "Request failed."), /Request failed\./);
});

test("rejects successful responses missing fields required by the caller", async () => {
  const response = new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  await assert.rejects(
    readApiResponse(response, "Booking failed.", ["bookingId"]),
    /Booking failed\./,
  );
});
