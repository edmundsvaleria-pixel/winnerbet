import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { 
      league, homeTeam, awayTeam, startTime, 
      homeOdds, drawOdds, awayOdds, result,
      correctScore, htFt // New JSON fields
    } = await req.json();

    if (!league || !homeTeam || !awayTeam || !startTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Parse the JSON strings safely
    let parsedCorrectScore = null;
    let parsedHtFt = null;
    try {
      if (correctScore) parsedCorrectScore = JSON.parse(correctScore);
      if (htFt) parsedHtFt = JSON.parse(htFt);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON format for Correct Score or HT/FT" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("matches")
      .insert({
        sport: "football",
        league,
        home_team: homeTeam,
        away_team: awayTeam,
        start_time: new Date(startTime).toISOString(),
        home_odds: Number(homeOdds) || 2.00,
        draw_odds: Number(drawOdds) || 3.00,
        away_odds: Number(awayOdds) || 3.50,
        result: result || null,
        correct_score_odds: parsedCorrectScore,
        ht_ft_odds: parsedHtFt,
        status: "upcoming"
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, match: data });
  } catch (err: any) {
    console.error("Create match error:", err);
    return NextResponse.json({ error: err.message || "Failed to create match" }, { status: 500 });
  }
}