import { NextResponse } from "next/server";

export const runtime = "edge"; // fast, no server needed

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.EMAIL_FROM;

    if (!apiKey || !fromEmail) {
      console.error("Missing BREVO_API_KEY or EMAIL_FROM env var", {
        hasApiKey: !!apiKey,
        fromEmail,
      });
      return NextResponse.json(
        { success: false, error: "Server misconfigured: missing email env vars." },
        { status: 500 }
      );
    }
    
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Neptune",
          email: fromEmail,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.message || "Failed to send email." },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Brevo send error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
