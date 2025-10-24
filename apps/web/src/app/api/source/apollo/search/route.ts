import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { query } = await req.json();
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "APOLLO_API_KEY not configured" }, { status: 500 });
  }
  // TODO: Call Apollo. Mock for now:
  const mock = [{ owner_name: "Alice Owner", company: "Alice LLC", property: "", city: "Chicago", email: "alice@example.com", source: "apollo" }];
  return NextResponse.json({ results: mock, query });
}
