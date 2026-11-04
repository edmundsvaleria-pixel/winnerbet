import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/ratelimit";
import { sendEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.ip ?? "127.0.0.1";
    const limitResult = rateLimit(ip, 10, 60000);

    if (!limitResult.success) {
      return NextResponse.json({ error: "Too many requests. Wait a minute." }, { status: 429 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { userId, selections, stake, totalOdds, potentialWin } = await req.json();
    if (!userId || !selections?.length || !stake) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (stake < 200) return NextResponse.json({ error: "Minimum stake GH₵ 200" }, { status: 400 });

    // 1. Fetch Profile
    const { data: profile } = await supabaseAdmin.from("profiles").select("email, username, available_balance, bonus_balance").eq("id", userId).single();
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const totalBalance = Number(profile.available_balance) + Number(profile.bonus_balance || 0);
    if (totalBalance < stake) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

    // 2. Increment Jackpot
    const { data: jackpot } = await supabaseAdmin.from("jackpots").select("current_amount").eq("name", "SportyMillions").single();
    if (jackpot) {
      await supabaseAdmin.from("jackpots").update({ current_amount: Number(jackpot.current_amount) + (stake * 0.02) }).eq("name", "SportyMillions");
    }

    // 3. Generate Codes
    const bookingCode = Array.from({ length: 7 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]).join("");
    const ticketId = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Insert Bet
    const { data: bet, error: betError } = await supabaseAdmin.from("bets").insert({
      user_id: userId, 
      stake, 
      total_odds: totalOdds, 
      potential_win: potentialWin, 
      status: "pending", 
      booking_code: bookingCode, 
      ticket_id: ticketId,
      selections,
      sport: "football" 
    }).select().single();

    if (betError) return NextResponse.json({ error: "Failed to place bet" }, { status: 500 });

    // 5. Deduct Balance (Bonus first, then available)
    let remainingStake = stake;
    let newAvailable = Number(profile.available_balance);
    let newBonus = Number(profile.bonus_balance || 0);

    if (newBonus >= remainingStake) {
      newBonus -= remainingStake;
    } else {
      remainingStake -= newBonus;
      newBonus = 0;
      newAvailable -= remainingStake;
    }

    await supabaseAdmin.from("profiles").update({ available_balance: newAvailable, bonus_balance: newBonus }).eq("id", userId);
    await supabaseAdmin.from("transactions").insert({ user_id: userId, type: "bet", amount: stake, status: "completed", reference: bookingCode });

    // 6. Send Receipt Email via Zoho
    if (profile.email) {
      const receiptHtml = `
        <div style="font-family: sans-serif; background: #0A0A0A; color: #fff; padding: 20px; border-radius: 10px; max-width: 500px; margin: auto;">
          <h2 style="color: #00C853; margin-bottom: 5px;">Bet Placed Successfully</h2>
          <p style="color: #A3A3A3; font-size: 14px; margin-top: 0;">Hi ${profile.username},</p>
          <div style="background: #1A1A1A; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #333;">
            <p style="margin: 5px 0; font-size: 14px;"><strong>Booking Code:</strong> <span style="font-size: 20px; color: #00C853; font-weight: bold; letter-spacing: 2px;">${bookingCode}</span></p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Ticket ID:</strong> ${ticketId}</p>
            <hr style="border: 0; border-top: 1px solid #333; margin: 10px 0;" />
            <p style="margin: 5px 0; font-size: 14px;"><strong>Stake:</strong> GH₵ ${stake.toFixed(2)}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Total Odds:</strong> ${totalOdds.toFixed(2)}</p>
            <p style="margin: 5px 0; font-size: 16px;"><strong>Potential Win:</strong> <span style="color: #00C853; font-weight: bold;">GH₵ ${potentialWin.toFixed(2)}</span></p>
          </div>
          <p style="font-size: 12px; color: #A3A3A3;">Good luck! You can track this bet on your My Bets page.</p>
        </div>
      `;
      // Fire and forget (don't await so it doesn't slow down the response)
      sendEmail(profile.email, "RiggedWin - Bet Receipt", receiptHtml).catch(console.error);
    }

    return NextResponse.json({ success: true, betId: bet.id, bookingCode, ticketId });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}