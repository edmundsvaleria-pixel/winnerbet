import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const data = await req.json();

    if (!data.league || !data.homeTeam || !data.awayTeam || !data.startTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("matches")
      .insert({
        sport: "football",
        league: data.league,
        home_team: data.homeTeam,
        away_team: data.awayTeam,
        start_time: new Date(data.startTime).toISOString(),
        home_odds: Number(data.homeOdds) || 2.00,
        draw_odds: Number(data.drawOdds) || 3.00,
        away_odds: Number(data.awayOdds) || 3.50,
        
        // Standard Markets
        over_1_5: Number(data.over15) || null,
        under_1_5: Number(data.under15) || null,
        over_2_5: Number(data.over25) || null,
        under_2_5: Number(data.under25) || null,
        over_3_5: Number(data.over35) || null,
        under_3_5: Number(data.under35) || null,

        // Custom Dynamic Markets (JSON)
        custom_ou_markets: data.customOU || [],

        // Text Fields
        correct_score: data.correctScore || null,
        ht_ft: data.htFt || null,
        
        result: data.result || null,
        status: "upcoming"
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Create match error:", err);
    return NextResponse.json({ error: err.message || "Failed to create match" }, { status: 500 });
  }
}