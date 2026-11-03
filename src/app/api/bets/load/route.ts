import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.PAYSTACK_SECRET_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing booking code" }, { status: 400 });
  }

  const { data: bet, error } = await supabaseAdmin
    .from("bets")
    .select("*")
    .eq("booking_code", code.toUpperCase())
    .single();

  if (error || !bet) {
    return NextResponse.json({ error: "Bet not found" }, { status: 404 });
  }

  return NextResponse.json({ bet });
}