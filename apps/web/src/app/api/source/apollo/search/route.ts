// app/api/source/apollo/search/route.ts
import { NextResponse } from "next/server";

type Filters = {
  company?: string;
  city?: string;
  person_titles?: string[];
  include_similar_titles?: boolean;
  q_keywords?: string;
  person_seniorities?: string[];
  organization_locations?: string[];
  q_organization_domains_list?: string[];
  contact_email_status?: string[];
  organization_num_employees_ranges?: string[];
  revenue_range_min?: number;
  revenue_range_max?: number;
  currently_using_all_of_technology_uids?: string[];
  currently_using_any_of_technology_uids?: string[];
  currently_not_using_any_of_technology_uids?: string[];
  page?: number;
  per_page?: number;
};

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
  {
    owner_name: "Alice Johnson",
    company: "Johnson Holdings LLC",
    city: "Chicago",
    email: "alice@johnsonholdings.com",
    title: "Managing Member",
    seniority: "owner",
    property: "1250 W Adams St",
    keywords: ["multifamily", "renovation", "west loop"],
    revenue: 4500000,
    source: "mock",
  },
  {
    owner_name: "Bob Martinez",
    company: "Martinez Development Group",
    city: "Austin",
    email: "bob@martinezdev.com",
    title: "Founder & Principal",
    seniority: "founder",
    property: "2101 E 6th St",
    keywords: ["development", "commercial", "texas"],
    revenue: 7200000,
    source: "mock",
  },
  {
    owner_name: "Carla Singh",
    company: "Singh Properties",
    city: "San Francisco",
    email: "carla@singhproperties.com",
    title: "Owner",
    seniority: "owner",
    property: "88 Mission St",
    keywords: ["luxury", "condos", "downtown"],
    revenue: 9500000,
    source: "mock",
  },
  {
    owner_name: "Emily Wang",
    company: "Wang Capital Partners",
    city: "New York",
    email: "emily@wangcap.com",
    title: "Real Estate Investor",
    seniority: "partner",
    property: "35 W 45th St",
    keywords: ["investment", "manhattan", "portfolio"],
    portfolio_size: 22,
    asset_type: ["multifamily", "commercial"],
    revenue: 25000000,
    source: "mock",
  },
];

export async function POST(req: Request) {
  const {
    company = "",
    city = "",
    person_titles,
    include_similar_titles,
    q_keywords,
    person_seniorities,
    organization_locations,
    q_organization_domains_list,
    contact_email_status,
    organization_num_employees_ranges,
    revenue_range_min,
    revenue_range_max,
    currently_using_all_of_technology_uids,
    currently_using_any_of_technology_uids,
    currently_not_using_any_of_technology_uids,
    page = 1,
    per_page = 10,
  } = (await req.json()) as Filters;

  const apiKey = process.env.APOLLO_API_KEY;
  const demoMode = process.env.APOLLO_DEMO === "1" || !apiKey;

  // MOCK / “test” mode (no key or APOLLO_DEMO=1)
  if (demoMode) {
    const filtered = MOCK_DATA.filter(
      (p) =>
        (!company || p.company.toLowerCase().includes(company.toLowerCase())) &&
        (!city || p.city.toLowerCase().includes(city.toLowerCase())) &&
        (!person_titles ||
          person_titles.some((t) =>
            p.title.toLowerCase().includes(t.toLowerCase())
          )) &&
        (!person_seniorities ||
          person_seniorities.some((s) => p.seniority === s)) &&
        (!q_keywords ||
          p.keywords?.some((k) =>
            k.toLowerCase().includes(q_keywords.toLowerCase())
          ))
    );

    return NextResponse.json({ results: filtered, mode: "mock" });
  }

  // REAL call (has key) — minimal filters (company, city, and others)
  const qs = new URLSearchParams();

  // helpers
  const appendArray = (key: string, values?: string[]) => {
    if (values?.length) values.forEach((v) => qs.append(`${key}[]`, v));
  };
  const append = (key: string, value?: string | number | boolean) => {
    if (value !== undefined && value !== "") qs.append(key, String(value));
  };

  // Basic filters
  if (company) appendArray("organization_names", [company]);
  if (city) appendArray("person_locations", [city]);

  // Extended filters (logical ones)
  appendArray("person_titles", person_titles);
  append("include_similar_titles", include_similar_titles);
  append("q_keywords", q_keywords);
  appendArray("person_seniorities", person_seniorities);
  appendArray("organization_locations", organization_locations);
  appendArray("q_organization_domains_list", q_organization_domains_list);
  appendArray("contact_email_status", contact_email_status);
  appendArray("organization_num_employees_ranges", organization_num_employees_ranges);
  append("revenue_range[min]", revenue_range_min);
  append("revenue_range[max]", revenue_range_max);
  appendArray("currently_using_all_of_technology_uids", currently_using_all_of_technology_uids);
  appendArray("currently_using_any_of_technology_uids", currently_using_any_of_technology_uids);
  appendArray("currently_not_using_any_of_technology_uids", currently_not_using_any_of_technology_uids);

  // Pagination (kept separate but still appended)
  append("page", page);
  append("per_page", per_page);

  const url = `https://api.apollo.io/api/v1/mixed_people/search?${qs}`;

  const makeRequest = async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey!, // header per docs
      },
      body: JSON.stringify({}), // Apollo docs: body optional when using query params
    });

    if (res.status === 429) {
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
    const mapped: ReturnType<typeof mapApolloPerson>[] = people.map(mapApolloPerson);

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