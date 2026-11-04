import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";



export async function GET(req: Request) {
  const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

  // 1. Secure the endpoint (Vercel adds this header for cron jobs)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Fetch pending bets that are older than 3 hours
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const { data: pendingBets } = await supabaseAdmin
      .from("bets")
      .select("*")
      .eq("status", "pending")
      .lt("created_at", threeHoursAgo);

    if (!pendingBets || pendingBets.length === 0) {
      return NextResponse.json({ message: "No bets to settle." });
    }

    // 3. Loop through and settle (Mock logic: randomly win/loss for demo)
    // In production, you'd fetch the final score from BSD using the match ID in selections
    for (const bet of pendingBets) {
      const isWin = Math.random() > 0.5; // 50% chance to win
      const outcome = isWin ? "won" : "lost";

      await supabaseAdmin.from("bets").update({ status: outcome }).eq("id", bet.id);

      if (isWin) {
        const { data: profile } = await supabaseAdmin.from("profiles").select("available_balance, withdrawable_balance").eq("id", bet.user_id).single();
        if (profile) {
          await supabaseAdmin.from("profiles").update({
            available_balance: Number(profile.available_balance) + Number(bet.potential_win),
            withdrawable_balance: Number(profile.withdrawable_balance) + Number(bet.potential_win),
          }).eq("id", bet.user_id);

          await supabaseAdmin.from("transactions").insert({
            user_id: bet.user_id, type: "win", amount: bet.potential_win, status: "completed", reference: bet.booking_code,
          });
        }
      }
    }

    return NextResponse.json({ success: true, settled: pendingBets.length });
  } catch (err) {
    console.error("Cron settle error:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}

