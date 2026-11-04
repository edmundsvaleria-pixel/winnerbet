import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { userId, selections } = await req.json();

    if (!userId || !selections?.length) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const bookingCode = Array.from({ length: 7 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]).join("");

    // Save as a 'shared' bet with 0 stake
    const { error } = await supabaseAdmin.from("bets").insert({
      user_id: userId,
      stake: 0,
      total_odds: selections.reduce((acc: number, s: any) => acc * s.odd, 1),
      potential_win: 0,
      status: "shared",
      booking_code: bookingCode,
      selections,
      sport: "football"
    });

    if (error) throw error;

    return NextResponse.json({ success: true, bookingCode });
  } catch (err) {
    return NextResponse.json({ error: "Failed to share" }, { status: 500 });
  }
}