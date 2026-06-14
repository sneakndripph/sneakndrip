import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = "donjulio263@gmail.com";
const FROM_EMAIL = "orders@sneakndrip.ph";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("newsletter_subscribers").insert({ email });

  if (error && !error.message.includes("duplicate")) {
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }

  if (resend) {
    resend.emails.send({
      from: `Sneak N' Drip <${FROM_EMAIL}>`,
      to: email,
      subject: "You're in! Welcome to Sneak N' Drip 🤙",
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
        <div style="background:#0D0D0D;padding:24px;text-align:center">
          <span style="font-size:18px;font-weight:900;letter-spacing:2px;color:#F2F0EF">SNEAK N' DRIP</span>
        </div>
        <div style="padding:32px 24px">
          <h2 style="color:#0D0D0D;margin:0 0 16px">You're on the list! 🎉</h2>
          <p style="color:#555;font-size:15px;line-height:1.6">
            Welcome to the Sneak N' Drip family! You'll be the first to know about new drops, restocks,
            and exclusive below-SRP deals.
          </p>
          <p style="color:#888;font-size:13px;margin-top:24px">
            Check out our latest sneakers at <a href="https://sneakndrip.ph/shop" style="color:#5BB8B4">sneakndrip.ph/shop</a>
          </p>
        </div>
        <div style="background:#0D0D0D;padding:16px;text-align:center">
          <p style="color:#666;font-size:12px;margin:0">© 2025 Sneak N' Drip · Philippines · 100% Authentic</p>
        </div>
      </div>`,
    }).catch(() => {});

    resend.emails.send({
      from: `Sneak N' Drip <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `📧 New Newsletter Subscriber: ${email}`,
      html: `<p>New subscriber: <strong>${email}</strong></p>`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
