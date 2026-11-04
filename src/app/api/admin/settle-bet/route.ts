import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.PAYSTACK_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    const { betId, outcome } = await req.json(); // outcome: "won" | "lost"

    if (!betId || !["won", "lost"].includes(outcome)) {
      return NextResponse.json({ error: "Invalid betId or outcome" }, { status: 400 });
    }

    // 1. Fetch the bet
    const { data: bet, error: betError } = await supabaseAdmin
      .from("bets")
      .select("*")
      .eq("id", betId)
      .single();

    if (betError || !bet) throw new Error("Bet not found");
    if (bet.status !== "pending") throw new Error("Bet is already settled");

    // 2. Update bet status
    const { error: updateError } = await supabaseAdmin
      .from("bets")
      .update({ status: outcome })
      .eq("id", betId);

    if (updateError) throw updateError;

    // 3. If won, credit the user
    if (outcome === "won") {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("available_balance, withdrawable_balance")
        .eq("id", bet.user_id)
        .single();

      if (profileError || !profile) throw new Error("Profile not found");

      const newAvailable = Number(profile.available_balance) + Number(bet.potential_win);
      const newWithdrawable = Number(profile.withdrawable_balance) + Number(bet.potential_win);

      await supabaseAdmin
        .from("profiles")
        .update({ 
          available_balance: newAvailable,
          withdrawable_balance: newWithdrawable
        })
        .eq("id", bet.user_id);

      // Log transaction
      await supabaseAdmin.from("transactions").insert({
        user_id: bet.user_id,
        type: "win",
        amount: Number(bet.potential_win),
        status: "completed",
        reference: bet.booking_code,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Settle bet error:", err);
    return NextResponse.json({ error: err.message || "Failed to settle bet" }, { status: 500 });
  }
}
