import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const pages = {
  home: readFileSync(resolve(root, "app/page.tsx"), "utf8"),
  filters: readFileSync(resolve(root, "app/vehicles/page.tsx"), "utf8"),
  details: readFileSync(resolve(root, "app/vehicles/[id]/page.tsx"), "utf8"),
  booking: readFileSync(resolve(root, "app/booking/page.tsx"), "utf8"),
};

function assertLabelledControls(source, ids) {
  for (const id of ids) {
    assert.match(source, new RegExp(`<label\\s+htmlFor=["']${id}["']`), `Missing label for ${id}`);
    assert.match(source, new RegExp(`<(?:input|select)[^>]+id=["']${id}["']`), `Missing control id ${id}`);
  }
}

test("homepage vehicle search controls have explicit labels", () => {
  assertLabelledControls(pages.home, [
    "home-location",
    "home-pickup-date",
    "home-return-date",
    "home-rental-type",
  ]);
});

test("vehicle filters have explicit labels and bounded price input", () => {
  assertLabelledControls(pages.filters, [
    "filter-location",
    "filter-category",
    "filter-max-price",
    "filter-sort",
  ]);
  assert.match(pages.filters, /id=["']filter-max-price["'][^>]+min=["']0["']/);
});

test("vehicle detail booking controls have explicit labels", () => {
  assertLabelledControls(pages.details, [
    "details-pickup-location",
    "details-pickup-date",
    "details-return-date",
    "details-rental-type",
  ]);
});

test("booking form exposes labels, busy state, and errors", () => {
  assertLabelledControls(pages.booking, [
    "booking-pickup-at",
    "booking-return-at",
    "booking-days",
    "booking-rental-type",
    "booking-payment-method",
  ]);
  assert.match(pages.booking, /<form[^>]+aria-busy=\{loading\}/);
  assert.match(pages.booking, /className=["']form-message["'][^>]+role=["']alert["']/);
  assert.match(pages.booking, /type=["']submit["']/);
});
