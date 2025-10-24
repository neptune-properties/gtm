import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    targets: [
      { id: "demo-1", owner_name: "Jane Doe", company: "Doe Holdings", property: "123 Maple St", city: "Ann Arbor", email: "jane@example.com", source: "apollo", status: "new" },
      { id: "demo-2", owner_name: "John Smith", company: "Smith Ventures", property: "45 Oak Ave", city: "Detroit", email: "john@example.com", source: "csv", status: "emailed" }
    ]
  });
}
