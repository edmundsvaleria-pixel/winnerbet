import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchMatches } from "@/lib/bsd";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(req.url);
    const betId = searchParams.get("betId");

    if (!betId) return NextResponse.json({ error: "Missing betId" }, { status: 400 });

    // 1. Fetch the bet
    const { data: bet } = await supabaseAdmin.from("bets").select("*").eq("id", betId).single();
    if (!bet || bet.status !== "pending") return NextResponse.json({ error: "Bet not eligible" }, { status: 400 });

    // 2. Fetch live matches to get current odds
    const liveMatches = await fetchMatches();
    
    let currentTotalOdds = 1;
    let allFound = true;

    // 3. Recalculate odds based on current market prices
    for (const selection of bet.selections) {
      const liveMatch = liveMatches.find(m => m.id === selection.matchId);
      
      if (!liveMatch || liveMatch.isLocked) {
        // If a match is locked (halftime) or missing, cashout is suspended
        allFound = false;
        break;
      }

      // Find the specific market and outcome the user bet on
      const market = liveMatch.markets.find((m: any) => m.name === selection.market);
      const outcome = market?.outcomes.find((o: any) => o.label === selection.pick);

      if (outcome && outcome.odds > 0) {
        currentTotalOdds *= outcome.odds;
      } else {
        allFound = false; // Market disappeared or odds are 0
        break;
      }
    }

    // 4. Calculate Cashout Value
    // Formula: (Stake * Current Odds) * House Margin (e.g., 0.90)
    // This means if your team is winning, current odds drop, value goes down (safe).
    // If your team is losing, current odds rise, value goes up (risky).
    let cashoutValue = 0;
    if (allFound) {
      // Apply a 10% margin (house edge) to the calculated value
      cashoutValue = (Number(bet.stake) * currentTotalOdds) * 0.90; 
    }

    // Don't offer cashout if value is less than 10% of stake (or 0)
    if (cashoutValue < Number(bet.stake) * 0.10) {
      cashoutValue = 0;
    }

    return NextResponse.json({ 
      cashoutValue: Number(cashoutValue.toFixed(2)), 
      available: cashoutValue > 0,
      currentOdds: currentTotalOdds
    });

  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}