import assert from "node:assert/strict";
import test from "node:test";

import {
  canManageBooking,
  canManageVehicle,
  getManagedCompany,
  getPrimaryRole,
  isPlatformAdmin,
} from "../lib/access-control.ts";

function supabaseMock(responses) {
  const queues = Object.fromEntries(
    Object.entries(responses).map(([table, values]) => [table, [...values]]),
  );
  const calls = [];

  return {
    calls,
    from(table) {
      calls.push({ method: "from", table });
      const response = queues[table]?.shift();
      if (!response) throw new Error(`Unexpected query for ${table}`);

      const builder = {
        select(columns) {
          calls.push({ method: "select", table, columns });
          return builder;
        },
        eq(column, value) {
          calls.push({ method: "eq", table, column, value });
          return builder;
        },
        limit(value) {
          calls.push({ method: "limit", table, value });
          return builder;
        },
        async maybeSingle() {
          calls.push({ method: "maybeSingle", table });
          return response;
        },
      };

      return builder;
    },
  };
}

test("primary role returns the stored role and defaults to customer", async () => {
  const assigned = supabaseMock({ user_roles: [{ data: { role: "platform_admin" } }] });
  const missing = supabaseMock({ user_roles: [{ data: null }] });

  assert.equal(await getPrimaryRole(assigned, "user-1"), "platform_admin");
  assert.equal(await getPrimaryRole(missing, "user-2"), "customer");
});

test("platform access is limited to the two administrator roles", async () => {
  for (const role of ["super_admin", "platform_admin"]) {
    const client = supabaseMock({ user_roles: [{ data: { role } }] });
    assert.equal(await isPlatformAdmin(client, "admin"), true);
  }

  const customer = supabaseMock({ user_roles: [{ data: { role: "customer" } }] });
  assert.equal(await isPlatformAdmin(customer, "customer"), false);
});

test("company owners are returned without an employee lookup", async () => {
  const client = supabaseMock({
    companies: [{ data: { id: "company-1", owner_id: "owner-1" } }],
  });

  assert.deepEqual(await getManagedCompany(client, "owner-1"), {
    id: "company-1",
    owner_id: "owner-1",
  });
  assert.equal(client.calls.filter((call) => call.method === "from").length, 1);
});

test("employee company access requires the requested permission", async () => {
  const allowed = supabaseMock({
    companies: [{ data: null }],
    company_employees: [{
      data: {
        company_id: "company-2",
        active: true,
        permissions: { "bookings.manage": true },
        companies: { owner_id: "owner-2" },
      },
    }],
  });
  const denied = supabaseMock({
    companies: [{ data: null }],
    company_employees: [{
      data: {
        company_id: "company-2",
        active: true,
        permissions: { "bookings.manage": false },
        companies: { owner_id: "owner-2" },
      },
    }],
  });

  assert.deepEqual(await getManagedCompany(allowed, "employee-1", "bookings.manage"), {
    id: "company-2",
    owner_id: "owner-2",
  });
  assert.equal(await getManagedCompany(denied, "employee-1", "bookings.manage"), null);
});

test("platform administrators can manage bookings without ownership queries", async () => {
  const client = supabaseMock({
    user_roles: [{ data: { role: "super_admin" } }],
  });

  assert.equal(await canManageBooking(client, "admin-1", "booking-1"), true);
  assert.deepEqual(
    client.calls.filter((call) => call.method === "from").map((call) => call.table),
    ["user_roles"],
  );
});

test("booking access supports direct owners and active permitted employees", async () => {
  const owner = supabaseMock({
    user_roles: [{ data: { role: "customer" } }],
    bookings: [{ data: { vehicles: { owner_id: "owner-1", company_id: null } } }],
  });
  const employee = supabaseMock({
    user_roles: [{ data: { role: "customer" } }],
    bookings: [{ data: { vehicles: { owner_id: "owner-1", company_id: "company-1" } } }],
    company_employees: [{ data: { active: true, permissions: { "bookings.manage": true } } }],
  });
  const inactive = supabaseMock({
    user_roles: [{ data: { role: "customer" } }],
    bookings: [{ data: { vehicles: { owner_id: "owner-1", company_id: "company-1" } } }],
    company_employees: [{ data: { active: false, permissions: { "bookings.manage": true } } }],
  });

  assert.equal(await canManageBooking(owner, "owner-1", "booking-1"), true);
  assert.equal(await canManageBooking(employee, "employee-1", "booking-1"), true);
  assert.equal(await canManageBooking(inactive, "employee-1", "booking-1"), false);
});

test("vehicle access supports company owners and rejects missing vehicles", async () => {
  const companyOwner = supabaseMock({
    user_roles: [{ data: { role: "customer" } }],
    vehicles: [{
      data: {
        owner_id: "different-owner",
        company_id: "company-1",
        companies: { owner_id: "company-owner" },
      },
    }],
  });
  const missing = supabaseMock({
    user_roles: [{ data: { role: "customer" } }],
    vehicles: [{ data: null }],
  });

  assert.equal(await canManageVehicle(companyOwner, "company-owner", "vehicle-1"), true);
  assert.equal(await canManageVehicle(missing, "customer-1", "missing"), false);
});

test("vehicle access requires an active employee with vehicle permission", async () => {
  const permitted = supabaseMock({
    user_roles: [{ data: { role: "customer" } }],
    vehicles: [{ data: { owner_id: "owner-1", company_id: "company-1", companies: null } }],
    company_employees: [{ data: { active: true, permissions: { "vehicles.manage": true } } }],
  });
  const denied = supabaseMock({
    user_roles: [{ data: { role: "customer" } }],
    vehicles: [{ data: { owner_id: "owner-1", company_id: "company-1", companies: null } }],
    company_employees: [{ data: { active: true, permissions: { "vehicles.manage": false } } }],
  });

  assert.equal(await canManageVehicle(permitted, "employee-1", "vehicle-1"), true);
  assert.equal(await canManageVehicle(denied, "employee-1", "vehicle-1"), false);
});
