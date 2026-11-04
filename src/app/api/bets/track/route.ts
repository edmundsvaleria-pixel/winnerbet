import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";



export async function GET(req: Request) {
  const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get("ticketId");

  if (!ticketId) return NextResponse.json({ error: "Missing Ticket ID" }, { status: 400 });

  const { data: bet, error } = await supabaseAdmin
    .from("bets")
    .select("*")
    .eq("ticket_id", ticketId.trim())
    .single();

  if (error || !bet) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  
  return NextResponse.json({ bet });
}
