import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { h } from "@/lib/email/helpers";
import { newsletterWelcome } from "@/lib/email/templates/newsletterWelcome";

const ADMIN_EMAIL = "donjulio263@gmail.com";

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 5, 60_000); // 5 signups/min per IP
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { email } = await req.json();
  if (!email || typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("newsletter_subscribers").insert({ email });

  if (error && !error.message.includes("duplicate")) {
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }

  const { subject, html } = newsletterWelcome();
  await Promise.all([
    sendEmail(email, subject, html),
    sendEmail(ADMIN_EMAIL, `New Newsletter Subscriber: ${email}`, `<p>New subscriber: <strong>${h(email)}</strong></p>`),
  ]);

  return NextResponse.json({ ok: true });
}
