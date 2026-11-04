"use client";

import { useState } from "react";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const SYMBOLS = ["🍒", "🍋", "🔔", "⭐", "7️⃣", "💎"];

export default function Hotline() {
  const symbol = useUserStore((s) => s.symbol);
  const balance = useUserStore((s) => s.balance);
  const setBalances = useUserStore((s) => s.setBalances);
  const withdrawable = useUserStore((s) => s.withdrawable);

  const [stake, setStake] = useState("100");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);

  const [reels, setReels] = useState([
    ["🍒", "🍋", "🔔"], ["🍒", "🍋", "🔔"], ["🍒", "🍋", "🔔"]
  ]);

  async function spin() {
    if (parseFloat(stake) < 10 || parseFloat(stake) > balance || spinning) return;
    
    setSpinning(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        game: "hotline",
        stake: parseFloat(stake),
        action: "spin",
        payload: {},
      }),
    });
    
    const data = await res.json();
    
    await new Promise(r => setTimeout(r, 1500));

    if (res.ok) {
      const newReels = [0, 1, 2].map(() =>
        Array.from({ length: 3 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
      );
      setReels(newReels);
      setBalances(data.newAvailableBalance, data.newWithdrawableBalance);
      setMessage(data.message);
    }
    setSpinning(false);
  }

  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="rounded-3xl border-8 border-wb-border-strong bg-wb-surface p-4 mb-6 shadow-2xl relative">
        <div className="flex justify-center gap-2 bg-black/50 p-4 rounded-xl border-2 border-wb-primary/30">
          {[0, 1, 2].map((reelIdx) => (
            <div key={reelIdx} className="flex flex-col gap-2 overflow-hidden h-[150px] w-20 border border-wb-border bg-wb-bg relative">
              <motion.div
                animate={spinning ? { y: [0, -150, 0] } : { y: 0 }}
                transition={{ duration: 0.4, repeat: spinning ? Infinity : 0, ease: "linear" }}
                className="flex flex-col gap-2 absolute top-0 w-full"
              >
                {reels[reelIdx].map((sym, rowIdx) => (
                  <div
                    key={rowIdx}
                    className={`h-14 flex items-center justify-center text-3xl rounded-md ${rowIdx === 1 ? "bg-wb-primary/20 border-2 border-wb-primary shadow-[0_0_10px_#00C853]" : "bg-wb-sub border border-wb-border"}`}
                  >
                    {sym}
                  </div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs font-bold uppercase tracking-widest text-wb-primary">Hotline</p>
      </div>

      <div className="flex gap-2 mb-4">
        <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} disabled={spinning} className="flex-1 rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white focus:border-wb-primary focus:outline-none" />
        <button onClick={spin} disabled={loading || spinning || parseFloat(stake) < 10 || parseFloat(stake) > balance} className="flex-1 rounded-xl bg-wb-primary py-3 text-sm font-bold text-black transition hover:bg-wb-primary-hover disabled:opacity-40">
          {loading || spinning ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "SPIN"}
        </button>
      </div>

      {/* Removed conflicting text-sm */}
      {message && <p className="text-lg text-wb-primary font-bold">{message}</p>}
      <p className="mt-4 text-xs text-wb-muted">Balance: {symbol} {balance.toFixed(2)}</p>
    </div>
  );
}
