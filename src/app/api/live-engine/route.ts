import { NextResponse } from "next/server";
import { fetchMatches, Match } from "@/lib/bsd";
import { generateMarkets, fluctuateOdds, MarketOdds } from "@/lib/odds-engine";
import { createClient } from "@supabase/supabase-js";



export async function GET() {
  const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

  try {
    let allMatches: Match[] = [];
    const apiMatches = await fetchMatches();
    allMatches = [...apiMatches];

    const { data: customMatches } = await supabaseAdmin.from("matches").select("*").neq("status", "finished");

    if (customMatches) {
      const mappedCustom: Match[] = customMatches.map((m: any) => ({
        id: m.id,
        league: m.league,
        homeTeam: m.home_team,
        awayTeam: m.away_team,
        startTime: m.start_time,
        status: m.status,
        source: "bsd",
        markets: [],
        customOdds: { home: Number(m.home_odds) || 2.0, draw: Number(m.draw_odds) || 3.2, away: Number(m.away_odds) || 3.5 }
      } as any));
      allMatches = [...mappedCustom, ...allMatches];
    }

    const now = Date.now();

    const processedMatches = allMatches.map((match) => {
      const startTime = new Date(match.startTime).getTime();
      const elapsedMins = (now - startTime) / 60000;

      let currentStatus = match.status;
      let isLocked = false;

      if (elapsedMins < 0) currentStatus = 'upcoming';
      else if (elapsedMins >= 0 && elapsedMins < 45) currentStatus = 'live';
      else if (elapsedMins >= 45 && elapsedMins < 60) { currentStatus = 'live'; isLocked = true; }
      else if (elapsedMins >= 60 && elapsedMins < 105) currentStatus = 'live';
      else currentStatus = 'finished';

      let finalMarkets: MarketOdds[] = [];
      
      if (isLocked) {
        finalMarkets = []; 
      } else if (currentStatus !== 'finished') {
        const baseHome = (match as any).customOdds?.home || match.markets?.find(m=>m.id==="1x2")?.outcomes.find(o=>o.label==="Home")?.odds || 2.0;
        const baseDraw = (match as any).customOdds?.draw || match.markets?.find(m=>m.id==="1x2")?.outcomes.find(o=>o.label==="Draw")?.odds || 3.2;
        const baseAway = (match as any).customOdds?.away || match.markets?.find(m=>m.id==="1x2")?.outcomes.find(o=>o.label==="Away")?.odds || 3.5;

        finalMarkets = generateMarkets(baseHome, baseDraw, baseAway).map(m => ({
          ...m,
          outcomes: m.outcomes.map(o => ({ ...o, odds: fluctuateOdds(o.odds, elapsedMins > 0 ? elapsedMins : 0, Math.random() * 3) }))
        }));
      }

      return { ...match, status: currentStatus, isLocked, markets: finalMarkets };
    });

    return NextResponse.json(processedMatches.filter(m => m.status !== 'finished'));
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}
