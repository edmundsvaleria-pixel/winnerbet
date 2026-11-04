import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { betId, cashoutValue } = await req.json();

    if (!betId || !cashoutValue) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Fetch the bet
    const { data: bet } = await supabaseAdmin
      .from("bets")
      .select("*")
      .eq("id", betId)
      .single();

    if (!bet || bet.status !== "pending") {
      return NextResponse.json({ error: "Bet not eligible" }, { status: 400 });
    }

    // 2. Update bet status
    const { error: updateError } = await supabaseAdmin
      .from("bets")
      .update({ 
        status: "cashed_out",
        potential_win: cashoutValue // Update potential win to the actual cashed out amount
      })
      .eq("id", betId);

    if (updateError) throw new Error("Failed to update bet status");

    // 3. Update Profile Balances
    // The stake was already deducted when the bet was placed.
    // So we just add the cashoutValue to the withdrawable balance.
    // We also add it to available_balance so the user can bet with it again.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("available_balance, withdrawable_balance")
      .eq("id", bet.user_id)
      .single();

    if (profile) {
      await supabaseAdmin
        .from("profiles")
        .update({ 
          available_balance: Number(profile.available_balance) + cashoutValue,
          withdrawable_balance: Number(profile.withdrawable_balance) + cashoutValue
        })
        .eq("id", bet.user_id);
    }

    // 4. Log transaction
    await supabaseAdmin.from("transactions").insert({
      user_id: bet.user_id, 
      type: "win", // Using 'win' for cashout so it shows green in history
      amount: cashoutValue, 
      status: "completed", 
      reference: `CASHOUT-${bet.booking_code}`,
    });

    return NextResponse.json({ success: true, cashoutValue });
    
  } catch (err: any) {
    console.error("Cashout error:", err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}