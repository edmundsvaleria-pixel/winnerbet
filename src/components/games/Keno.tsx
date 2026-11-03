"use client";

import { useState } from "react";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function Keno() {
  const symbol = useUserStore((s) => s.symbol);
  const balance = useUserStore((s) => s.balance);
  const setBalances = useUserStore((s) => s.setBalances);
  const withdrawable = useUserStore((s) => s.withdrawable);

  const [stake, setStake] = useState("100");
  const [picked, setPicked] = useState<number[]>([]);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggle(n: number) {
    if (picked.includes(n)) setPicked((p) => p.filter((x) => x !== n));
    else if (picked.length < 10) setPicked((p) => [...p, n]);
  }

  async function draw() {
    if (picked.length !== 10 || parseFloat(stake) < 10 || parseFloat(stake) > balance) return;
    setLoading(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const drawSet = new Set<number>();
    while (drawSet.size < 20) drawSet.add(Math.floor(Math.random() * 80) + 1);
    const drawnArray = Array.from(drawSet);
    setDrawn(drawnArray);

    const hits = picked.filter((n) => drawSet.has(n)).length;

    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        game: "keno",
        stake: parseFloat(stake),
        action: "draw",
        payload: { hits },
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setBalances(data.newBalance, withdrawable);
      setMessage(`${hits} hits. ${data.message}`);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="grid grid-cols-10 gap-1 mb-4">
        {Array.from({ length: 80 }).map((_, i) => {
          const n = i + 1;
          const isPicked = picked.includes(n);
          const isDrawn = drawn.includes(n);
          const isHit = isPicked && isDrawn;
          return (
            <button
              key={n}
              onClick={() => toggle(n)}
              disabled={loading || drawn.length > 0}
              className={`aspect-square rounded text-[10px] font-bold transition ${
                isHit ? "bg-wb-primary text-black" :
                isDrawn ? "bg-wb-danger text-white" :
                isPicked ? "bg-wb-surface border border-wb-primary text-wb-primary" :
                "bg-wb-sub text-wb-muted"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-wb-muted mb-3">Picked: {picked.length}/10</p>

      <div className="flex gap-2 mb-4">
        <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} disabled={loading} className="flex-1 rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white" />
        <button onClick={draw} disabled={loading || picked.length !== 10 || parseFloat(stake) < 10 || parseFloat(stake) > balance} className="flex-1 rounded-xl bg-wb-primary py-3 text-sm font-bold text-black disabled:opacity-40">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Draw"}
        </button>
      </div>

      {message && <p className="text-sm text-wb-primary font-semibold text-center">{message}</p>}
      <p className="mt-4 text-xs text-wb-muted text-center">Balance: {symbol} {balance.toFixed(2)}</p>
    </div>
  );
}