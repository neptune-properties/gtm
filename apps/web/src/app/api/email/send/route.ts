import { NextResponse } from "next/server";
import { MockEmailProvider, renderTemplate } from "@neptune/shared";

type Body = { to: string; subject: string; bodyMd: string; data: Record<string, string>; };

export async function POST(req: Request) {
  const { to, subject, bodyMd, data } = await req.json() as Body;
  const html = renderTemplate(bodyMd, data);
  const res = await MockEmailProvider.send({ to, subject, html, customId: `target:${data?.id ?? ""}` });
  return NextResponse.json({ ok: true, messageId: res.messageId });
}
