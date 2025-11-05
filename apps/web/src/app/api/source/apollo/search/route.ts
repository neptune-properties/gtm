// app/api/source/apollo/search/route.ts
import { NextResponse } from "next/server";

type Filters = { company?: string; city?: string };

// simple sleep helper
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function mapApolloPerson(p: any) {
  // Apollo sample payload fields → our targets table shape
  return {
    owner_name: p?.name ?? [p?.first_name, p?.last_name].filter(Boolean).join(" "),
    company: p?.organization?.name ?? p?.employment_history?.[0]?.organization_name ?? "",
    city: p?.city ?? p?.organization?.city ?? "",
    email: p?.email ?? "", // not always present in search; mock mode includes it
    property: "",          // optional per AC
    source: "apollo" as const,
  };
}

// local “test data” to avoid burning credits (when no key or APOLLO_DEMO=1)
const MOCK_DATA = [
  { owner_name: "Alice Owner", company: "Alice LLC", city: "Chicago", email: "alice@example.com", property: "", source: "mock" },
  { owner_name: "Bob Martinez", company: "Innova Labs", city: "Austin", email: "bob@innovalabs.com", property: "", source: "mock" },
  { owner_name: "Carla Singh", company: "TechNova", city: "San Francisco", email: "carla@technova.com", property: "", source: "mock" },
  { owner_name: "Emily Wang", company: "Stripe", city: "New York", email: "ewanger@example.com", property: "", source: "mock" },
];

export async function POST(req: Request) {
  const { company = "", city = "" } = (await req.json()) as Filters;
  const apiKey = process.env.APOLLO_API_KEY;
  const demoMode = process.env.APOLLO_DEMO === "1" || !apiKey;

  // MOCK / “test” mode (no key or APOLLO_DEMO=1)
  if (demoMode) {
    const filtered = MOCK_DATA.filter(
      (p) =>
        (!company || p.company.toLowerCase().includes(company.toLowerCase())) &&
        (!city || p.city.toLowerCase().includes(city.toLowerCase()))
    );
    return NextResponse.json({ results: filtered, mode: "mock" });
  }

  // REAL call (has key) — minimal filters (company, city)
  // Docs: POST /v1/mixed_people/search with headers including X-Api-Key. :contentReference[oaicite:2]{index=2}
  const qs = new URLSearchParams();
  if (company) qs.append("organization_names[]", company);
  if (city) qs.append("person_locations[]", city);
  // keep payload small
  qs.append("per_page", "10");
  const url = `https://api.apollo.io/api/v1/mixed_people/search?${qs}`;

  const makeRequest = async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey!, // header per docs
        // Note: Some older examples show bearer tokens; current tutorial shows X-Api-Key. :contentReference[oaicite:3]{index=3}
      },
      // body not required if using query params for filters
      body: JSON.stringify({}), 
    });

    if (res.status === 429) {
      // simple, single backoff using Retry-After if present (rate limit guidance). :contentReference[oaicite:4]{index=4}
      const retryAfter = Number(res.headers.get("Retry-After") ?? "1");
      await delay(Math.min(10, Math.max(1, retryAfter)) * 1000);
      return fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "X-Api-Key": apiKey!,
        },
        body: JSON.stringify({}),
      });
    }
    return res;
  };

  try {
    const res = await makeRequest();

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "Apollo API error", status: res.status, details: text },
        { status: res.status }
      );
    }

    const json = await res.json();
    const people = Array.isArray(json?.people) ? json.people : [];
    const mapped = people.map(mapApolloPerson);

    // In real search, email may be missing; keep entries with email so dedupe works.
    const results = mapped.filter((p) => p.email);

    return NextResponse.json({ results, mode: "live" });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unexpected error calling Apollo", details: String(err) },
      { status: 500 }
    );
  }
}
