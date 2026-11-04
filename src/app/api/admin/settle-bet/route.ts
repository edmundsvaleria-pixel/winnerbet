import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { betId, outcome } = await req.json(); // outcome: "won" | "lost" | "void"

    if (!betId || !["won", "lost", "void"].includes(outcome)) {
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

    // 3. Fetch user profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, username, available_balance, withdrawable_balance")
      .eq("id", bet.user_id)
      .single();

    if (!profile) throw new Error("Profile not found");

    // 4. Handle balance updates based on outcome
    if (outcome === "won") {
      const newAvailable = Number(profile.available_balance) + Number(bet.potential_win);
      const newWithdrawable = Number(profile.withdrawable_balance) + Number(bet.potential_win);

      await supabaseAdmin
        .from("profiles")
        .update({ available_balance: newAvailable, withdrawable_balance: newWithdrawable })
        .eq("id", bet.user_id);

      await supabaseAdmin.from("transactions").insert({
        user_id: bet.user_id, type: "win", amount: Number(bet.potential_win), status: "completed", reference: bet.booking_code,
      });

      // 5. Send Winning Email
      if (profile.email) {
        const winHtml = `
          <div style="font-family: sans-serif; background: #0A0A0A; color: #fff; padding: 30px; border-radius: 10px; text-align: center; max-width: 500px; margin: auto; border: 1px solid #00C853;">
            <h1 style="color: #00C853; font-size: 50px; margin: 0;">🏆</h1>
            <h2 style="color: #fff; margin-top: 10px;">Congratulations, ${profile.username}!</h2>
            <p style="color: #A3A3A3;">Your bet <strong style="color: #fff;">${bet.booking_code}</strong> has won!</p>
            <div style="background: #1A1A1A; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #A3A3A3; font-size: 14px; text-transform: uppercase;">Winnings</p>
              <p style="margin: 5px 0 0 0; color: #00C853; font-size: 32px; font-weight: bold;">GH₵ ${Number(bet.potential_win).toFixed(2)}</p>
            </div>
            <p style="color: #A3A3A3; font-size: 14px;">The funds have been added to your RiggedWin wallet.</p>
          </div>
        `;
        sendEmail(profile.email, "RiggedWin - You Won! 🎉", winHtml).catch(console.error);
      }
    } 
    else if (outcome === "void") {
      // Refund stake
      const newAvailable = Number(profile.available_balance) + Number(bet.stake);
      await supabaseAdmin
        .from("profiles")
        .update({ available_balance: newAvailable })
        .eq("id", bet.user_id);

      await supabaseAdmin.from("transactions").insert({
        user_id: bet.user_id, type: "refund", amount: Number(bet.stake), status: "completed", reference: `VOID-${bet.booking_code}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Settle bet error:", err);
    return NextResponse.json({ error: err.message || "Failed to settle bet" }, { status: 500 });
  }
}