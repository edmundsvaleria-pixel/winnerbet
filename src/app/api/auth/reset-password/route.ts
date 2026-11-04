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

    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // 1. Check if user exists
    const { data: profile } = await supabaseAdmin.from("profiles").select("id, username").eq("email", email).single();
    if (!profile) return NextResponse.json({ error: "No account found with this email" }, { status: 404 });

    // 2. Generate 8-digit random code
    const otp = Math.floor(10000000 + Math.random() * 90000000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // 3. Save to database
    await supabaseAdmin.from("profiles").update({
      reset_token: otp,
      reset_token_expires: expiresAt
    }).eq("id", profile.id);

    // 4. Send Email
    const html = `
      <div style="font-family: sans-serif; background: #0A0A0A; color: #fff; padding: 20px; border-radius: 10px;">
        <h2 style="color: #00C853;">Reset Your Password</h2>
        <p>Hello ${profile.username},</p>
        <p>Your 8-digit verification code is:</p>
        <h1 style="background: #1A1A1A; padding: 10px 20px; display: inline-block; letter-spacing: 5px; border-radius: 5px;">${otp}</h1>
        <p>This code expires in 15 minutes.</p>
        <p style="color: #A3A3A3; font-size: 12px;">If you didn't request this, ignore this email.</p>
      </div>
    `;

    await sendEmail(email, "RiggedWin - Password Reset Code", html);

    return NextResponse.json({ success: true, message: "Code sent to email." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}