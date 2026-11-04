import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";



export async function POST(req: Request) {
  const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.PAYSTACK_SECRET_KEY!
);

  try {
    const { 
      league, homeTeam, awayTeam, startTime, 
      homeOdds, drawOdds, awayOdds 
    } = await req.json();

    if (!league || !homeTeam || !awayTeam || !startTime || !homeOdds || !drawOdds || !awayOdds) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("matches")
      .insert({
        sport: "football",
        league,
        home_team: homeTeam,
        away_team: awayTeam,
        start_time: new Date(startTime).toISOString(),
        home_odds: Number(homeOdds),
        draw_odds: Number(drawOdds),
        away_odds: Number(awayOdds),
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

