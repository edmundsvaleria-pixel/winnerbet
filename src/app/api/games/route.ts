import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// FIXED: Using the correct Supabase Service Role Key from .env.local
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function randomHex(bytes = 16) {
  return crypto.randomBytes(bytes).toString('hex');
}

function hmac(serverSeed: string, clientSeed: string, nonce: number) {
  return crypto.createHmac('sha256', serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest('hex');
}

export async function POST(req: Request) {
  try {
    const { userId, game, stake, action, payload = {} } = await req.json();
    if (!userId || !game || !stake) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (stake < 10) return NextResponse.json({ error: "Min stake GH₵ 10" }, { status: 400 });

    // 1. Check Balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("available_balance, withdrawable_balance")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    if (Number(profile.available_balance) < stake) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // 2. PROVABLY FAIR RNG SETUP
    const serverSeed = randomHex(16);
    const clientSeed = payload.clientSeed || userId;
    const nonce = Date.now();
    const hash = hmac(serverSeed, clientSeed, nonce);

    let winAmount = 0;
    let resultMessage = "You lost.";
    let outcomeData: any = {};

    // 3. GAME LOGIC
    if (game === "dice") {
      const int = parseInt(hash.slice(0, 8), 16);
      const roll = (int % 10001) / 100;
      const target = Number(payload.target || 50);
      const over = Boolean(payload.over);
      outcomeData = { roll: roll.toFixed(2) };

      const won = over ? roll > target : roll < target;
      if (won) {
        const chance = over ? (100 - target) / 100 : target / 100;
        const multiplier = Math.max(1.01, 0.97 / chance);
        winAmount = stake * multiplier;
        resultMessage = `You won ${winAmount.toFixed(2)}! Roll: ${roll.toFixed(2)}`;
      } else {
        resultMessage = `You lost. Roll: ${roll.toFixed(2)}`;
      }
    } 
    else if (game === "jetx") {
      const int = parseInt(hash.slice(0, 8), 16);
      const crashPoint = int % 101 === 0 ? 1.00 : Math.max(1, Math.floor((2**32 / (int + 1)) * 0.99) / 100);
      const userCashout = Number(payload.multiplier);
      outcomeData = { crashPoint };

      if (userCashout <= crashPoint) {
        winAmount = stake * userCashout;
        resultMessage = `Cashed out at ${userCashout.toFixed(2)}x! You won ${winAmount.toFixed(2)}!`;
      } else {
        resultMessage = `Crashed at ${crashPoint.toFixed(2)}x! You lost.`;
      }
    }
    else if (game === "mines") {
      const mines: number[] = [];
      let cursor = 0;
      while (mines.length < 3) {
        const h = hmac(serverSeed, clientSeed, cursor);
        for (let i = 0; i < h.length && mines.length < 3; i += 8) {
          const val = parseInt(h.slice(i, i + 8), 16);
          const tile = (val % 25) + 1;
          if (!mines.includes(tile)) mines.push(tile);
        }
        cursor++;
      }
      
      const revealedTiles: number[] = payload.revealedTiles || [];
      const hitMine = revealedTiles.some((t: number) => mines.includes(t));
      outcomeData = { mines, hitMine };

      if (!hitMine && revealedTiles.length > 0) {
        const multiplier = Math.pow(25 / 22, revealedTiles.length);
        winAmount = stake * multiplier;
        resultMessage = `Safe! You won ${winAmount.toFixed(2)}!`;
      } else {
        resultMessage = `Boom! You hit a mine.`;
      }
    }
    else if (game === "plinko") {
      const int = parseInt(hash.slice(0, 8), 16);
      const slot = int % 9; 
      const SLOTS = [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6];
      const multiplier = SLOTS[slot];
      
      if (multiplier > 1) {
        winAmount = stake * multiplier;
        resultMessage = `You won ${winAmount.toFixed(2)}! Landed on ${multiplier}x`;
      } else {
        resultMessage = `Landed on ${multiplier}x. You lost.`;
      }
      outcomeData = { slot, multiplier };
    }

    // 4. Update Database (Deducts stake, adds winnings to both balances)
    const newAvailableBalance = Number(profile.available_balance) - stake + winAmount;
    const newWithdrawableBalance = Number(profile.withdrawable_balance) + (winAmount > 0 ? winAmount : 0);

    const { error: updateError } = await supabaseAdmin.from("profiles").update({ 
      available_balance: newAvailableBalance,
      withdrawable_balance: newWithdrawableBalance
    }).eq("id", userId);

    if (updateError) {
      console.error("Update balance error:", updateError);
      return NextResponse.json({ error: "Failed to update balance" }, { status: 500 });
    }

    // Log Transaction
    await supabaseAdmin.from("transactions").insert({
      user_id: userId, 
      type: winAmount > 0 ? "win" : "bet", 
      amount: winAmount > 0 ? winAmount : stake, 
      status: "completed", 
      reference: `${game.toUpperCase()}-${Date.now()}`,
    });

    // 5. Return Result + New Balances for instant Zustand update
    return NextResponse.json({ 
      success: true, 
      winAmount, 
      newAvailableBalance, 
      newWithdrawableBalance, 
      message: resultMessage, 
      ...outcomeData,
      serverSeed, clientSeed, nonce
    });
  } catch (err) {
    console.error("Game API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}