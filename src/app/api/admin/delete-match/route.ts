import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { matchId } = await req.json();
    if (!matchId) return NextResponse.json({ error: "Missing matchId" }, { status: 400 });

    // 1. Mark match as void (this removes it from the live engine)
    await supabaseAdmin.from("matches").update({ status: "void" }).eq("id", matchId);

    // 2. Find pending bets for this match and refund them
    const { data: pendingBets } = await supabaseAdmin
      .from("bets")
      .select("*")
      .eq("status", "pending")
      .contains("selections", [{ matchId }]); 

    if (pendingBets) {
      for (const bet of pendingBets) {
        // Mark bet as void
        await supabaseAdmin.from("bets").update({ status: "void" }).eq("id", bet.id);

        // Refund the user's available balance
        const { data: profile } = await supabaseAdmin.from("profiles").select("available_balance").eq("id", bet.user_id).single();
        if (profile) {
          await supabaseAdmin.from("profiles").update({
            available_balance: Number(profile.available_balance) + Number(bet.stake),
          }).eq("id", bet.user_id);

          // Log transaction
          await supabaseAdmin.from("transactions").insert({
            user_id: bet.user_id, type: "refund", amount: bet.stake, status: "completed", reference: `VOID-${bet.booking_code}`,
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete match error:", err);
    return NextResponse.json({ error: "Failed to delete match" }, { status: 500 });
  }
}