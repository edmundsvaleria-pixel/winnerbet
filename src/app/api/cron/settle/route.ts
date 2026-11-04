import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Find all matches that started more than 5 minutes ago and haven't been settled
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: matchesToSettle } = await supabaseAdmin
      .from("matches")
      .select("*")
      .eq("status", "upcoming")
      .lt("start_time", fiveMinsAgo);

    if (!matchesToSettle || matchesToSettle.length === 0) {
      return NextResponse.json({ message: "No matches to settle." });
    }

    let settledCount = 0;

    for (const match of matchesToSettle) {
      // 2. Generate a random result for the match
      const homeScore = Math.floor(Math.random() * 4); // 0-3 goals
      const awayScore = Math.floor(Math.random() * 4);
      const finalResult = `${homeScore}-${awayScore}`;

      // 3. Update the match status to finished and save the result
      await supabaseAdmin
        .from("matches")
        .update({ 
          status: "finished", 
          result: finalResult,
          full_time_home_score: homeScore,
          full_time_away_score: awayScore
        })
        .eq("id", match.id);

      // 4. Find all pending bets for this match
      const { data: pendingBets } = await supabaseAdmin
        .from("bets")
        .select("*")
        .eq("status", "pending")
        .contains("selections", [{ matchId: match.id }]); 

      if (!pendingBets) continue;

      // 5. Settle each bet
      for (const bet of pendingBets) {
        let isWin = false;
        const selection = bet.selections.find((s: any) => s.matchId === match.id);
        
        if (!selection) continue;

        // Check if the selection matches the result
        if (selection.market === "1x2" || selection.market === "Match Result") {
          if (selection.pick === "Home" && homeScore > awayScore) isWin = true;
          if (selection.pick === "Draw" && homeScore === awayScore) isWin = true;
          if (selection.pick === "Away" && awayScore > homeScore) isWin = true;
        } 
        else if (selection.market.includes("Over/Under 2.5")) {
          const total = homeScore + awayScore;
          if (selection.pick === "Over 2.5" && total > 2.5) isWin = true;
          if (selection.pick === "Under 2.5" && total < 2.5) isWin = true;
        }

        // 6. Update bet status
        const outcome = isWin ? "won" : "lost";
        await supabaseAdmin.from("bets").update({ status: outcome }).eq("id", bet.id);

        // 7. If won, credit the user
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
    }

    return NextResponse.json({ success: true, settledMatches: matchesToSettle.length, settledBets: settledCount });
  } catch (err) {
    console.error("Cron settle error:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}