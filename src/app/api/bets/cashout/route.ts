import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.PAYSTACK_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    const { betId } = await req.json();

    if (!betId) {
      return NextResponse.json({ error: "Missing betId" }, { status: 400 });
    }

    // 1. Fetch the bet
    const { data: bet, error: betError } = await supabaseAdmin
      .from("bets")
      .select("*")
      .eq("id", betId)
      .single();

    if (betError || !bet) throw new Error("Bet not found");
    if (bet.status !== "pending") throw new Error("Bet is already settled or cashed out");

    // 2. Calculate Cash Out Value
    // In a real app, this should fetch the current live odds of all selections.
    // For this mock, we'll offer 85% of the potential win if the bet is looking good,
    // or 90% of the stake as a consolation.
    // For a simple implementation, let's just give them 80% of their stake back as the "cash out" value.
    const cashOutValue = Number(bet.stake) * 0.80; 

    // 3. Update bet status to 'cashed_out'
    const { error: updateError } = await supabaseAdmin
      .from("bets")
      .update({ status: "lost" }) // We'll mark as lost to remove from pending, but credit the cashout
      .eq("id", betId);

    if (updateError) throw updateError;

    // 4. Credit user's wallet
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("available_balance, withdrawable_balance")
      .eq("id", bet.user_id)
      .single();

    if (profile) {
      await supabaseAdmin
        .from("profiles")
        .update({ 
          available_balance: Number(profile.available_balance) + cashOutValue,
          withdrawable_balance: Number(profile.withdrawable_balance) + cashOutValue
        })
        .eq("id", bet.user_id);

      // Log transaction
      await supabaseAdmin.from("transactions").insert({
        user_id: bet.user_id,
        type: "win",
        amount: cashOutValue,
        status: "completed",
        reference: `CASHOUT-${bet.booking_code}`,
      });
    }

    return NextResponse.json({ success: true, cashOutValue });
  } catch (err: any) {
    console.error("Cashout error:", err);
    return NextResponse.json({ error: err.message || "Failed to cash out" }, { status: 500 });
  }
}