"use client";

import { useState } from "react";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function Dice() {
  const symbol = useUserStore((s) => s.symbol);
  const balance = useUserStore((s) => s.balance);
  const setBalances = useUserStore((s) => s.setBalances);
  const withdrawable = useUserStore((s) => s.withdrawable);

  const [stake, setStake] = useState("100");
  const [target, setTarget] = useState(50);
  const [over, setOver] = useState(true);
  const [roll, setRoll] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const chance = over ? (100 - target) / 100 : target / 100;
  const multiplier = Math.max(1.01, 0.97 / chance);

  async function handleRoll() {
    if (parseFloat(stake) < 10 || parseFloat(stake) > balance) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const result = Math.random() * 100;
    setRoll(result);

    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        game: "dice",
        stake: parseFloat(stake),
        action: "roll",
        payload: { roll: result, target, over },
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setBalances(data.newBalance, withdrawable);
      setMessage(data.message);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="rounded-2xl border border-wb-border bg-wb-surface p-6 mb-4">
        <div className="text-center mb-4">
          <p className="text-xs uppercase text-wb-muted mb-1">Roll Result</p>
          <p className={`text-5xl font-black tabular-nums ${roll !== null ? (over ? (roll > target ? "text-wb-primary" : "text-wb-danger") : (roll < target ? "text-wb-primary" : "text-wb-danger")) : "text-white"}`}>
            {roll !== null ? roll.toFixed(2) : "—"}
          </p>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setOver(true)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${over ? "bg-wb-primary text-black" : "bg-wb-sub text-wb-muted"}`}>Over</button>
          <button onClick={() => setOver(false)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${!over ? "bg-wb-primary text-black" : "bg-wb-sub text-wb-muted"}`}>Under</button>
        </div>

        <input
          type="range"
          min={2}
          max={98}
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="w-full accent-wb-primary"
        />
        <div className="flex justify-between text-xs text-wb-muted mt-1">
          <span>2</span>
          <span className="font-bold text-white">Target: {target}</span>
          <span>98</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 text-center">
          <div className="rounded-lg bg-wb-bg p-2">
            <p className="text-xs text-wb-muted">Chance</p>
            <p className="text-sm font-bold text-white">{(chance * 100).toFixed(1)}%</p>
          </div>
          <div className="rounded-lg bg-wb-bg p-2">
            <p className="text-xs text-wb-muted">Multiplier</p>
            <p className="text-sm font-bold text-wb-primary">{multiplier.toFixed(2)}×</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} className="flex-1 rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white" />
        <button onClick={handleRoll} disabled={loading || parseFloat(stake) < 10 || parseFloat(stake) > balance} className="flex-1 rounded-xl bg-wb-primary py-3 text-sm font-bold text-black disabled:opacity-40">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Roll"}
        </button>
      </div>

      {message && <p className="text-sm text-wb-primary font-semibold text-center">{message}</p>}
      <p className="mt-4 text-xs text-wb-muted text-center">Balance: {symbol} {balance.toFixed(2)}</p>
    </div>
  );
}