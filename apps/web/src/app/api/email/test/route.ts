import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY!,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Neptune Test",
          email: process.env.EMAIL_FROM!,
        },
        to: [{ email: "nwlvrd@umich.edu" }], // put your real email
        subject: "Brevo Test Email",
        htmlContent: "<h1>This is a Neptune/Brevo test email</h1>",
      }),
    });

    const result = await res.json();

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
