"use client";

import { useState } from "react";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const HORSES = [
  { id: 0, name: "Thunder", odds: 2.5 },
  { id: 1, name: "Blaze", odds: 3.0 },
  { id: 2, name: "Shadow", odds: 4.0 },
  { id: 3, name: "Storm", odds: 5.0 },
  { id: 4, name: "Comet", odds: 6.5 },
  { id: 5, name: "Rocket", odds: 8.0 },
];

export default function HorseRacing() {
  const symbol = useUserStore((s) => s.symbol);
  const balance = useUserStore((s) => s.balance);
  const setBalances = useUserStore((s) => s.setBalances);
  const withdrawable = useUserStore((s) => s.withdrawable);

  const [stake, setStake] = useState("100");
  const [picked, setPicked] = useState<number | null>(null);
  const [racing, setRacing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<number[]>(HORSES.map(() => 0));

  async function race() {
    if (picked === null || parseFloat(stake) < 10 || parseFloat(stake) > balance) return;
    setRacing(true);
    setMessage(null);
    setPositions(HORSES.map(() => 0));

    const winnerIdx = Math.random() < 0.4 ? picked : Math.floor(Math.random() * HORSES.length);
    const finalPositions = HORSES.map((_, i) => (i === winnerIdx ? 100 : Math.floor(Math.random() * 80)));

    for (let step = 1; step <= 10; step++) {
      await new Promise((r) => setTimeout(r, 100));
      setPositions(finalPositions.map((p) => (p * step) / 10));
    }

    const won = winnerIdx === picked;
    const odds = HORSES[picked].odds;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        game: "horseracing",
        stake: parseFloat(stake),
        action: "race",
        payload: { won, odds },
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setBalances(data.newBalance, withdrawable);
      setMessage(data.message);
    }
    setLoading(false);
    setRacing(false);
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="rounded-2xl border border-wb-border bg-wb-surface p-4 mb-4">
        {HORSES.map((h, i) => (
          <div key={h.id} className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-bold w-16 truncate ${picked === i ? "text-wb-primary" : "text-wb-muted"}`}>
              {h.name}
            </span>
            <div className="flex-1 h-4 rounded-full bg-wb-bg relative overflow-hidden">
              <motion.div
                className={`h-full ${picked === i ? "bg-wb-primary" : "bg-wb-border-strong"}`}
                animate={{ width: `${positions[i]}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <span className="text-xs text-wb-muted w-8">{h.odds}×</span>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-wb-muted mb-2">Pick your horse:</p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {HORSES.map((h, i) => (
          <button
            key={h.id}
            onClick={() => setPicked(i)}
            disabled={racing}
            className={`rounded-lg border py-2 text-xs font-bold transition ${
              picked === i ? "bg-wb-primary border-wb-primary text-black" : "bg-wb-sub border-wb-border-strong text-white"
            }`}
          >
            {h.name} ({h.odds}×)
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} disabled={racing} className="flex-1 rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white" />
        <button onClick={race} disabled={loading || racing || picked === null || parseFloat(stake) < 10 || parseFloat(stake) > balance} className="flex-1 rounded-xl bg-wb-primary py-3 text-sm font-bold text-black disabled:opacity-40">
          {loading || racing ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Race"}
        </button>
      </div>

      {message && <p className="text-sm text-wb-primary font-semibold text-center">{message}</p>}
      <p className="mt-4 text-xs text-wb-muted text-center">Balance: {symbol} {balance.toFixed(2)}</p>
    </div>
  );
}