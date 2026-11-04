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

    if (!betId || !cashoutValue) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const { data: bet } = await supabaseAdmin.from("bets").select("*").eq("id", betId).single();
    if (!bet || bet.status !== "pending") return NextResponse.json({ error: "Bet not eligible" }, { status: 400 });

    // 1. Update bet status to CASHEd_OUT
    await supabaseAdmin.from("bets").update({ 
      status: "cashed_out",
      potential_win: cashoutValue // Update potential win to the actual cashed out amount
    }).eq("id", betId);

    // 2. Credit user wallet
    const { data: profile } = await supabaseAdmin.from("profiles").select("available_balance, withdrawable_balance").eq("id", bet.user_id).single();
    if (profile) {
      await supabaseAdmin.from("profiles").update({ 
        available_balance: Number(profile.available_balance) + cashoutValue,
        withdrawable_balance: Number(profile.withdrawable_balance) + cashoutValue
      }).eq("id", bet.user_id);
    }

    // 3. Log transaction
    await supabaseAdmin.from("transactions").insert({
      user_id: bet.user_id, type: "win", amount: cashoutValue, status: "completed", reference: `CASHOUT-${bet.booking_code}`,
    });

    return NextResponse.json({ success: true, cashoutValue });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}