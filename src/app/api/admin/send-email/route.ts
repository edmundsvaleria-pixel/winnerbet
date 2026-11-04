import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { targetEmail, subject, message } = await req.json();

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    let emails: string[] = [];

    if (targetEmail === "ALL") {
      // Fetch all user emails
      const { data: profiles, error } = await supabaseAdmin.from("profiles").select("email");
      if (error) throw error;
      emails = profiles.map(p => p.email).filter(Boolean);
    } else {
      emails = [targetEmail];
    }

    if (emails.length === 0) {
      return NextResponse.json({ error: "No emails found" }, { status: 404 });
    }

    // Format message with HTML
    const html = `
      <div style="font-family: sans-serif; background: #0A0A0A; color: #fff; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
        <h2 style="color: #00C853;">${subject}</h2>
        <div style="background: #1A1A1A; padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid #333; white-space: pre-wrap;">
          ${message}
        </div>
        <p style="font-size: 12px; color: #A3A3A3; margin-top: 20px;">Sent by RiggedWin Admin.</p>
      </div>
    `;

    // Send to all recipients
    let successCount = 0;
    for (const email of emails) {
      const res = await sendEmail(email, subject, html);
      if (res.success) successCount++;
    }

    return NextResponse.json({ success: true, sent: successCount, total: emails.length });
  } catch (err: any) {
    console.error("Bulk email error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}