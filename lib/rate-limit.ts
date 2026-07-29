import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type RateLimitRow = {
  allowed: boolean;
  remaining: number;
  reset_at: string;
};

/**
 * Enforces a per-account limit stored atomically in Postgres.
 * Limit values are selected by the database, not supplied by the caller.
 * Store errors fail closed so protected writes never silently lose throttling.
 */
export async function enforceRateLimit(
  supabase: SupabaseClient,
  scope: string,
  message = "Too many requests. Please try again shortly.",
) {
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_scope: scope,
    p_identity: "account",
  });

  if (error) {
    console.error("Distributed rate limiter unavailable", { scope, message: error.message });
    return NextResponse.json(
      { error: "Request protection is temporarily unavailable. Please retry shortly." },
      { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "5" } },
    );
  }

  const candidate = Array.isArray(data) ? data[0] : data;
  const row = candidate as RateLimitRow | null;
  if (!row || typeof row.allowed !== "boolean") {
    console.error("Distributed rate limiter returned an invalid result", { scope });
    return NextResponse.json(
      { error: "Request protection is temporarily unavailable. Please retry shortly." },
      { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "5" } },
    );
  }

  if (row.allowed) return null;

  const resetTime = Date.parse(row.reset_at);
  const retryAfter = Number.isFinite(resetTime)
    ? Math.max(1, Math.ceil((resetTime - Date.now()) / 1000))
    : 60;

  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": String(Math.max(0, Number(row.remaining) || 0)),
      },
    },
  );
}
