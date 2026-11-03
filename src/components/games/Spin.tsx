"use client";

import { useState } from "react";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { motion, useAnimation } from "framer-motion";

const SEGMENTS = [0, 0.5, 1, 2, 3, 5, 10, 20];

export default function Spin() {
  const symbol = useUserStore((s) => s.symbol);
  const balance = useUserStore((s) => s.balance);
  const setBalances = useUserStore((s) => s.setBalances);
  const withdrawable = useUserStore((s) => s.withdrawable);

  const [stake, setStake] = useState("100");
  const [result, setResult] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const controls = useAnimation();

  async function spin() {
    if (parseFloat(stake) < 10 || parseFloat(stake) > balance) return;
    setSpinning(true);
    setMessage(null);

    const index = Math.floor(Math.random() * SEGMENTS.length);
    const multiplier = SEGMENTS[index];
    setResult(multiplier);

    const segmentAngle = 360 / SEGMENTS.length;
    const targetAngle = 360 * 5 + (360 - index * segmentAngle);

    await controls.start({
      rotate: targetAngle,
      transition: { duration: 3, ease: [0.2, 0.8, 0.3, 1] },
    });

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        game: "spin",
        stake: parseFloat(stake),
        action: "spin",
        payload: { segment: multiplier },
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setBalances(data.newBalance, withdrawable);
      setMessage(data.message);
    }
    setLoading(false);
    setSpinning(false);
  }

  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="relative w-64 h-64 mx-auto mb-6">
        <motion.div
          animate={controls}
          className="w-full h-full rounded-full border-8 border-wb-border-strong flex items-center justify-center"
          style={{
            background: `conic-gradient(${SEGMENTS.map((_, i) => {
              const start = (i / SEGMENTS.length) * 360;
              const end = ((i + 1) / SEGMENTS.length) * 360;
              const colors = ["#1A1A1A", "#2A2A2A", "#333", "#444", "#1A1A1A", "#2A2A2A", "#333", "#444"];
              return `${colors[i]} ${start}deg ${end}deg`;
            }).join(", ")})`,
          }}
        >
          <div className="w-16 h-16 rounded-full bg-wb-bg flex items-center justify-center">
            <span className="text-2xl">🎡</span>
          </div>
        </motion.div>
        {result !== null && !spinning && (
          <p className="mt-4 text-sm font-bold text-white">Landed on {result}×</p>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} disabled={spinning} className="flex-1 rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white" />
        <button onClick={spin} disabled={loading || spinning || parseFloat(stake) < 10 || parseFloat(stake) > balance} className="flex-1 rounded-xl bg-wb-primary py-3 text-sm font-bold text-black disabled:opacity-40">
          {loading || spinning ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Spin"}
        </button>
      </div>

      {message && <p className="text-sm text-wb-primary font-semibold">{message}</p>}
      <p className="mt-4 text-xs text-wb-muted">Balance: {symbol} {balance.toFixed(2)}</p>
    </div>
  );
}