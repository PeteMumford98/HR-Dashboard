#!/usr/bin/env node
// Checks that the app can reach Supabase and that supabase/schema.sql has
// been applied. Run after filling in .env: `npm run check:supabase`.
// No dependencies; reads .env directly so it works before `npm install`.

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);

for (const file of [".env", ".env.local"]) {
  const path = resolve(ROOT, file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const TABLES = ["employees", "meetings", "objectives", "writeups", "guidelines", "share_links", "audit_log"];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function isSet(value) {
  return !!value && !value.startsWith("YOUR_");
}

let failed = false;
const fail = (msg) => { failed = true; console.error(`  ✗ ${msg}`); };
const ok = (msg) => console.log(`  ✓ ${msg}`);
const warn = (msg) => console.warn(`  ! ${msg}`);

console.log("Supabase connection check\n");

console.log("Environment variables");
if (!isSet(url)) fail("NEXT_PUBLIC_SUPABASE_URL is missing or still a placeholder (Supabase → Settings → API)");
else ok(`NEXT_PUBLIC_SUPABASE_URL = ${url}`);
if (!isSet(anonKey)) fail("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or still a placeholder");
else ok("NEXT_PUBLIC_SUPABASE_ANON_KEY is set");
if (!isSet(serviceKey)) warn("SUPABASE_SERVICE_ROLE_KEY not set — share links won't render publicly, and this check can't see seed data through RLS");
else ok("SUPABASE_SERVICE_ROLE_KEY is set");

if (!isSet(url) || !isSet(anonKey)) {
  console.error("\nFill in .env (copy from .env.example) and re-run. The app runs on the in-memory demo store until these are set.");
  process.exit(1);
}

console.log("\nConnectivity");
try {
  const res = await fetch(`${url}/auth/v1/health`, { headers: { apikey: anonKey } });
  if (res.ok) ok("Project reachable, anon key accepted");
  else fail(`Auth health check returned ${res.status} — check the URL and anon key`);
} catch (err) {
  fail(`Could not reach ${url}: ${err.message}`);
}

if (!failed) {
  console.log("\nSchema (supabase/schema.sql)");
  const key = isSet(serviceKey) ? serviceKey : anonKey;
  for (const table of TABLES) {
    const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (res.ok) ok(`table ${table}`);
    else if (res.status === 404) fail(`table ${table} not found — run supabase/schema.sql in the SQL editor`);
    else fail(`table ${table}: HTTP ${res.status} ${await res.text()}`);
  }

  if (isSet(serviceKey)) {
    console.log("\nSeed data (supabase/seed.sql)");
    const res = await fetch(`${url}/rest/v1/guidelines?select=id&limit=1`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (res.ok && (await res.json()).length > 0) ok("guidelines table has content — the review pass has something to check against");
    else if (res.ok) warn("guidelines table is empty — run supabase/seed.sql, then replace with Cartwright's real guidelines");
  }
}

if (failed) {
  console.error("\nNot connected yet — fix the items above and re-run.");
  process.exit(1);
}
console.log("\nAll good. The app will use Supabase instead of the demo store.");
