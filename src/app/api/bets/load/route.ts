import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";



export async function GET(req: Request) {
  const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Missing booking code" }, { status: 400 });
    }

    // ilike makes it case-insensitive, trim removes accidental spaces
    const { data: bet, error } = await supabaseAdmin
      .from("bets")
      .select("*")
      .ilike("booking_code", code.trim())
      .single();

    if (error || !bet) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    }

    return NextResponse.json({ bet });
  } catch (err) {
    console.error("Load bet error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

