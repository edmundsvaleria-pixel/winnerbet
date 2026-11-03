"use client";

import { useState } from "react";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const SLOTS = [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6];
const COLORS = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-wb-primary", "bg-green-500", "bg-yellow-500", "bg-orange-500", "bg-red-500"];

export default function Plinko() {
  const symbol = useUserStore((s) => s.symbol);
  const balance = useUserStore((s) => s.balance);
  const setBalances = useUserStore((s) => s.setBalances); // Used for instant update

  const [stake, setStake] = useState("200");
  const [dropping, setDropping] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function drop() {
    if (parseFloat(stake) < 10 || parseFloat(stake) > balance) return;
    setDropping(true);
    setMessage(null);
    setActiveSlot(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, game: "plinko", stake: parseFloat(stake), action: "drop", payload: {} }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error);
      setDropping(false);
      return;
    }

    // Animate the drop for 1.2s then reveal
    setTimeout(() => {
      setActiveSlot(data.slot ?? 4);
      setBalances(data.newAvailableBalance, data.newWithdrawableBalance); // INSTANT UI UPDATE
      setMessage(data.message);
      setDropping(false);
    }, 1200);
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="relative rounded-2xl border border-wb-border bg-wb-surface p-6 mb-4 h-[400px] flex flex-col items-center overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          {Array.from({ length: 8 }).map((_, row) => (
            <div key={row} className="flex justify-center gap-4 mt-6" style={{ marginLeft: row % 2 === 0 ? '0' : '16px' }}>
              {Array.from({ length: 9 }).map((_, col) => <div key={col} className="w-2 h-2 rounded-full bg-white shadow-sm" />)}
            </div>
          ))}
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex gap-1 h-12">
          {SLOTS.map((mult, i) => (
            <div key={i} className={`flex-1 flex items-center justify-center rounded-sm text-[10px] font-bold text-black transition-all ${COLORS[i]} ${activeSlot === i ? "ring-2 ring-white scale-110 shadow-lg z-20" : "opacity-90"}`}>
              {mult}×
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} disabled={dropping} className="flex-1 rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm font-semibold text-white focus:border-wb-primary focus:outline-none" />
        <button onClick={drop} disabled={loading || dropping || parseFloat(stake) < 10 || parseFloat(stake) > balance} className="flex-1 rounded-xl bg-wb-primary py-3 text-sm font-bold text-black transition hover:bg-wb-primary-hover disabled:opacity-40 flex items-center justify-center">
          {loading || dropping ? <Loader2 className="h-5 w-5 animate-spin" /> : "Drop Ball"}
        </button>
      </div>

      {message && <p className={`text-sm font-semibold text-center ${message.includes('won') ? 'text-wb-primary' : 'text-wb-danger'}`}>{message}</p>}
      <p className="mt-4 text-xs text-wb-muted text-center">Balance: {symbol} {balance.toFixed(2)}</p>
    </div>
  );
}