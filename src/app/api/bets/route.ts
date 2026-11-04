import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/ratelimit";



export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

  try {
    const ip = req.ip ?? "127.0.0.1";
    const limitResult = rateLimit(ip, 10, 60000);

    if (!limitResult.success) {
      return NextResponse.json({ error: "Too many requests. Wait a minute." }, { status: 429 });
    }

    const { userId, selections, stake, totalOdds, potentialWin } = await req.json();
    if (!userId || !selections?.length || !stake) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (stake < 200) return NextResponse.json({ error: "Minimum stake GH₵ 200" }, { status: 400 });

    const { data: profile } = await supabaseAdmin.from("profiles").select("available_balance, bonus_balance").eq("id", userId).single();
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const totalBalance = Number(profile.available_balance) + Number(profile.bonus_balance || 0);
    if (totalBalance < stake) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

    // Increment Jackpot
    const { data: jackpot } = await supabaseAdmin.from("jackpots").select("current_amount").eq("name", "SportyMillions").single();
    if (jackpot) {
      await supabaseAdmin.from("jackpots").update({ current_amount: Number(jackpot.current_amount) + (stake * 0.02) }).eq("name", "SportyMillions");
    }

    // Generate Booking Code (7 letters) and Ticket ID (6 digits)
    const bookingCode = Array.from({ length: 7 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]).join("");
    const ticketId = Math.floor(100000 + Math.random() * 900000).toString();

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

    // Deduct balance (Bonus first, then available)
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

    return NextResponse.json({ success: true, betId: bet.id, bookingCode, ticketId });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
