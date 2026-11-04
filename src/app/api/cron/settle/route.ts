import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BSD_API_KEY = process.env.NEXT_PUBLIC_BSD_API_KEY;

export async function GET(req: Request) {
  // Security check (Vercel Cron sends this header)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch pending bets that are older than 2 hours (assuming match is over)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: pendingBets } = await supabaseAdmin
      .from("bets")
      .select("*")
      .eq("status", "pending")
      .lt("created_at", twoHoursAgo);

    if (!pendingBets || pendingBets.length === 0) {
      return NextResponse.json({ message: "No bets to settle." });
    }

    let settledCount = 0;

    for (const bet of pendingBets) {
      // 2. Fetch actual results from BSD for the match
      // (Assuming bet.selections[0].matchId contains the BSD event ID)
      const matchId = bet.selections?.[0]?.matchId;
      if (!matchId) continue;

      const res = await fetch(`https://sports.bzzoiro.com/api/v2/events/${matchId}/`, {
        headers: { Authorization: `Token ${BSD_API_KEY}` }
      });
      
      if (!res.ok) continue;
      const matchData = await res.json();

      // 3. Check if match is finished
      if (matchData.status !== 'finished') continue;

      // 4. Determine Win/Loss based on the actual score
      const homeScore = matchData.home_score;
      const awayScore = matchData.away_score;
      
      // Example logic: Check if the user's pick was correct
      // (You should expand this to handle all 100+ markets)
      const selection = bet.selections[0];
      let isWin = false;

      if (selection.market === "Match Result") {
        if (selection.pick === "Home" && homeScore > awayScore) isWin = true;
        if (selection.pick === "Draw" && homeScore === awayScore) isWin = true;
        if (selection.pick === "Away" && awayScore > homeScore) isWin = true;
      }
      // Add logic for Over/Under, BTTS, etc. here...

      const outcome = isWin ? "won" : "lost";

      // 5. Update Bet Status
      await supabaseAdmin.from("bets").update({ status: outcome }).eq("id", bet.id);

      // 6. If Won, Credit User
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
      settledCount++;
    }

    return NextResponse.json({ success: true, settled: settledCount });
  } catch (err) {
    console.error("Cron settle error:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}