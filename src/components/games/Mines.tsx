"use client";

import { useState } from "react";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Bomb, Gem } from "lucide-react";
import { motion } from "framer-motion";

export default function Mines() {
  const symbol = useUserStore((s) => s.symbol);
  const balance = useUserStore((s) => s.balance);
  const setBalances = useUserStore((s) => s.setBalances);

  const [stake, setStake] = useState("200");
  const [mines] = useState(3);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [hitMine, setHitMine] = useState(false);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function start() {
    const positions: number[] = [];
    while (positions.length < mines) {
      const p = Math.floor(Math.random() * 25);
      if (!positions.includes(p)) positions.push(p);
    }
    setMinePositions(positions);
    setRevealed([]);
    setHitMine(false);
    setActive(true);
    setMessage(null);
  }

  function pick(index: number) {
    if (!active || hitMine || revealed.includes(index)) return;
    if (minePositions.includes(index)) {
      setHitMine(true);
      setActive(false);
    } else {
      setRevealed((r) => [...r, index]);
    }
  }

  async function cashOut() {
    if (!active || hitMine || revealed.length === 0) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id, game: "mines", stake: parseFloat(stake), action: "cashout", payload: { revealed: revealed.length, hitMine: false },
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setBalances(data.newAvailableBalance, data.newWithdrawableBalance);
      setMessage(data.message);
      setActive(false);
    }
    setLoading(false);
  }

  const multiplier = revealed.length > 0 ? Math.pow(25 / 22, revealed.length) : 1;

  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="flex gap-2 mb-4">
        <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} disabled={active} className="flex-1 rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white focus:border-wb-primary focus:outline-none" />
        <button onClick={active ? cashOut : start} disabled={loading || (!active && (parseFloat(stake) < 10 || parseFloat(stake) > balance))} className="flex-1 rounded-xl bg-wb-primary py-3 text-sm font-bold text-black transition hover:bg-wb-primary-hover disabled:opacity-40">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : active ? `Cash Out (${multiplier.toFixed(2)}×)` : "Start"}
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-4" style={{ perspective: "1000px" }}>
        {Array.from({ length: 25 }).map((_, i) => {
          const isMine = minePositions.includes(i);
          const isRevealed = revealed.includes(i);
          const isHit = hitMine && isMine;
          const showResult = isRevealed || isHit || (hitMine && active === false);

          return (
            <div key={i} onClick={() => pick(i)} className="aspect-square cursor-pointer relative" style={{ transformStyle: "preserve-3d" }}>
              <motion.div
                animate={{ rotateY: showResult ? 180 : 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full h-full relative"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="absolute inset-0 rounded-xl bg-wb-sub border border-wb-border-strong flex items-center justify-center hover:border-wb-primary transition" style={{ backfaceVisibility: "hidden" }}>
                  <span className="text-wb-muted text-xl font-bold">?</span>
                </div>
                <div className={`absolute inset-0 rounded-xl border flex items-center justify-center ${isHit ? "bg-wb-danger border-wb-danger" : "bg-wb-primary border-wb-primary"}`} style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                  {isHit ? <Bomb className="h-8 w-8 text-black" /> : <Gem className="h-8 w-8 text-black" />}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {message && <p className="text-wb-primary font-semibold">{message}</p>}
      {/* Removed conflicting text-sm */}
      {hitMine && <p className="text-wb-danger font-bold text-lg">💥 BOOM! You hit a mine.</p>}
      <p className="mt-4 text-xs text-wb-muted">Balance: {symbol} {balance.toFixed(2)}</p>
    </div>
  );
}