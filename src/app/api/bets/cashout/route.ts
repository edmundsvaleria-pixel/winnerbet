import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Make sure we are using the Service Role Key for admin privileges


export async function POST(req: Request) {
  const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    if (betError || !bet) {
      console.error("Bet fetch error:", betError);
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    }

    if (bet.status !== "pending") {
      return NextResponse.json({ error: "Bet is already settled or cashed out" }, { status: 400 });
    }

    // 2. Calculate Cash Out Value
    // For this demo, we give 80% of the stake back. 
    // In production, this would use live odds to calculate a fair value.
    const cashOutValue = Number(bet.stake) * 0.80;

    // 3. Update bet status
    const { error: updateError } = await supabaseAdmin
      .from("bets")
      .update({ 
        status: "lost", // Marked as lost so it doesn't get settled again
        is_cashed_out: true
      })
      .eq("id", betId);

    if (updateError) {
      console.error("Bet update error:", updateError);
      throw new Error("Failed to update bet status");
    }

    // 4. Fetch user profile and credit balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("available_balance, withdrawable_balance")
      .eq("id", bet.user_id)
      .single();

    if (profileError || !profile) {
      console.error("Profile fetch error:", profileError);
      throw new Error("Profile not found");
    }

    const newAvailable = Number(profile.available_balance) + cashOutValue;
    const newWithdrawable = Number(profile.withdrawable_balance) + cashOutValue;

    const { error: balanceError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        available_balance: newAvailable,
        withdrawable_balance: newWithdrawable
      })
      .eq("id", bet.user_id);

    if (balanceError) {
      console.error("Balance update error:", balanceError);
      throw new Error("Failed to credit balance");
    }

    // 5. Log the transaction
    await supabaseAdmin.from("transactions").insert({
      user_id: bet.user_id,
      type: "win", // Using 'win' so it shows as a green positive in history
      amount: cashOutValue,
      status: "completed",
      reference: `CASHOUT-${bet.booking_code}`,
    });

    return NextResponse.json({ success: true, cashOutValue });
    
  } catch (err: any) {
    console.error("Cashout API Error:", err);
    return NextResponse.json({ error: err.message || "Failed to cash out" }, { status: 500 });
  }
}

