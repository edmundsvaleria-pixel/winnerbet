"use client";

import { useState } from "react";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Penalty() {
  const symbol = useUserStore((s) => s.symbol);
  const balance = useUserStore((s) => s.balance);
  const setBalances = useUserStore((s) => s.setBalances);

  const [stake, setStake] = useState("100");
  const [goals, setGoals] = useState(0);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Animation states
  const [shotDir, setShotDir] = useState<"left" | "center" | "right" | null>(null);
  const [keeperDir, setKeeperDir] = useState<"left" | "center" | "right" | null>(null);
  const [isScored, setIsScored] = useState<boolean | null>(null);

  function start() {
    setGoals(0);
    setActive(true);
    setMessage(null);
    setShotDir(null);
    setKeeperDir(null);
    setIsScored(null);
  }

  async function shoot(direction: "left" | "center" | "right") {
    if (!active || shotDir) return;

    setShotDir(direction);
    const kDive = ["left", "center", "right"][Math.floor(Math.random() * 3)] as "left" | "center" | "right";
    setKeeperDir(kDive);

    const scored = kDive !== direction || Math.random() < 0.4; // 40% chance to score if keeper guesses right
    setIsScored(scored);

    if (!scored) {
      setTimeout(() => {
        setActive(false);
        setMessage("Saved! Round over. You lost your stake.");
      }, 1500);
      return;
    }

    setTimeout(() => {
      const newGoals = goals + 1;
      setGoals(newGoals);
      setMessage(`GOAL! ${newGoals} scored.`);
      setShotDir(null);
      setKeeperDir(null);
      setIsScored(null);
    }, 1500);
  }

  async function cashOut() {
    if (!active || goals === 0) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        game: "penalty",
        stake: parseFloat(stake),
        action: "shoot",
        payload: { goals },
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setBalances(data.newAvailableBalance, data.newWithdrawableBalance);
      setMessage(data.message);
      setActive(false);
      setGoals(0);
    }
    setLoading(false);
  }

  const multiplier = goals > 0 ? Math.pow(1.5, goals) : 1;

  return (
    <div className="max-w-xl mx-auto text-center">
      {/* The Pitch */}
      <div className="relative w-full aspect-[2/1] rounded-xl bg-green-800 border-4 border-green-600 overflow-hidden mb-6" style={{ perspective: "800px" }}>
        {/* Goal Net */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3/4 h-1/2 border-4 border-white/50 bg-white/5">
          <div className="w-full h-full opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, transparent 49%, #fff 50%, transparent 51%), linear-gradient(0deg, transparent 49%, #fff 50%, transparent 51%)', backgroundSize: '20px 20px' }} />
        </div>

        {/* Goalkeeper */}
        {keeperDir && (
          <motion.div
            initial={{ x: "-50%", y: 0, rotate: 0 }}
            animate={{ 
              x: keeperDir === "left" ? "-150%" : keeperDir === "right" ? "50%" : "-50%",
              y: keeperDir === "center" ? -20 : 10,
              rotate: keeperDir === "left" ? -45 : keeperDir === "right" ? 45 : 0
            }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-1/4 left-1/2 w-8 h-16 bg-blue-500 rounded-t-full border-2 border-blue-700 z-10"
          />
        )}

        {/* The Ball */}
        <motion.div
          initial={{ x: "-50%", y: 0, scale: 1 }}
          animate={shotDir ? {
            x: shotDir === "left" ? "-250%" : shotDir === "right" ? "150%" : "-50%",
            y: shotDir === "center" ? -100 : -80,
            scale: 0.4,
            rotate: 720
          } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute bottom-0 left-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-gray-300 z-20"
        />

        {isScored === true && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30">
            <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-5xl font-black text-wb-primary drop-shadow-xl">GOAL!</motion.p>
          </div>
        )}
        {isScored === false && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30">
            <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-5xl font-black text-wb-danger drop-shadow-xl">SAVED!</motion.p>
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-2xl font-black text-white">{goals} Goals <span className="text-wb-primary ml-2">({multiplier.toFixed(2)}×)</span></p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {(["left", "center", "right"] as const).map((dir) => (
          <button
            key={dir}
            onClick={() => shoot(dir)}
            disabled={!active || !!shotDir || loading}
            className="rounded-xl border border-wb-border-strong bg-wb-surface py-4 text-sm font-bold text-white capitalize transition hover:border-wb-primary disabled:opacity-40"
          >
            {dir}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} disabled={active || loading} className="flex-1 rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white focus:border-wb-primary focus:outline-none" />
        <button onClick={active ? cashOut : start} disabled={loading || (!active && (parseFloat(stake) < 10 || parseFloat(stake) > balance))} className="flex-1 rounded-xl bg-wb-primary py-3 text-sm font-bold text-black transition hover:bg-wb-primary-hover disabled:opacity-40">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : active ? `Cash Out (${multiplier.toFixed(2)}×)` : "Start"}
        </button>
      </div>

      {message && <p className="text-sm text-wb-primary font-semibold">{message}</p>}
      <p className="mt-4 text-xs text-wb-muted">Balance: {symbol} {balance.toFixed(2)}</p>
    </div>
  );
}
