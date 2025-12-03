import { NextResponse } from "next/server";
import Brevo from "@getbrevo/brevo";

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "BREVO_API_KEY not configured" },
        { status: 500 }
      );
    }

    const client = new Brevo.TransactionalEmailsApi();
    client.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      apiKey
    );

    const sendPayload: Brevo.SendSmtpEmail = {
      sender: { name: "Neptune Properties", email: "no-reply@neptune.com" },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html,
    };

    const response = await client.sendTransacEmail(sendPayload);

    return NextResponse.json({ success: true, response });
  } catch (error: any) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
