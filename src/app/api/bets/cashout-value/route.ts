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
      const liveMatch = liveMatches.find(m => m.id === selection.matchId) as any; // Cast to any to bypass strict type check
      
      if (!liveMatch || liveMatch.isLocked) {
        allFound = false;
        break;
      }

      const market = liveMatch.markets.find((m: any) => m.name === selection.market);
      const outcome = market?.outcomes.find((o: any) => o.label === selection.pick);

      if (outcome && outcome.odds > 0) {
        currentTotalOdds *= outcome.odds;
      } else {
        allFound = false;
        break;
      }
    }

    // 4. Calculate Cashout Value
    let cashoutValue = 0;
    if (allFound) {
      cashoutValue = (Number(bet.stake) * currentTotalOdds) * 0.90; 
    }

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