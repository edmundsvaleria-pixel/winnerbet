"use client";

import { useState } from "react";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import VirtualPitch from "./VirtualPitch";

type Market = "1X2" | "OU" | "BTTS";

export default function VirtualFootball() {
  const symbol = useUserStore((s) => s.symbol);
  const balance = useUserStore((s) => s.balance);
  const setBalances = useUserStore((s) => s.setBalances);
  const withdrawable = useUserStore((s) => s.withdrawable);

  const [stake, setStake] = useState("100");
  const [market, setMarket] = useState<Market>("1X2");
  const [pick, setPick] = useState("home");
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function kickOff() {
    if (parseFloat(stake) < 10 || parseFloat(stake) > balance) return;
    setRunning(true);
    setScore({ home: 0, away: 0 });
    setMessage(null);

    // Simulate match over ~3 seconds (30 sec compressed)
    let h = 0, a = 0;
    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 800));
      const goal = Math.random();
      if (goal < 0.3) h++;
      else if (goal < 0.6) a++;
      setScore({ home: h, away: a });
    }

    // Determine outcome
    let won = false;
    if (market === "1X2") {
      if (pick === "home" && h > a) won = true;
      if (pick === "draw" && h === a) won = true;
      if (pick === "away" && a > h) won = true;
    } else if (market === "OU") {
      const total = h + a;
      won = pick === "over" ? total > 2.5 : total < 2.5;
    } else if (market === "BTTS") {
      won = pick === "yes" ? h > 0 && a > 0 : !(h > 0 && a > 0);
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        game: "virtualfootball",
        stake: parseFloat(stake),
        action: "settle",
        payload: { won, odds: market === "1X2" ? 2.5 : 1.9 },
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setBalances(data.newBalance, withdrawable);
      setMessage(data.message);
    }
    setLoading(false);
    setRunning(false);
  }

  return (
    <div className="max-w-lg mx-auto">
      <VirtualPitch homeScore={score.home} awayScore={score.away} />

      <div className="flex gap-2 mt-4 mb-3">
        {(["1X2", "OU", "BTTS"] as Market[]).map((m) => (
          <button key={m} onClick={() => { setMarket(m); setPick(m === "OU" ? "over" : m === "BTTS" ? "yes" : "home"); }} disabled={running}
            className={`flex-1 py-2 rounded-lg text-xs font-bold ${market === m ? "bg-wb-primary text-black" : "bg-wb-sub text-wb-muted"}`}>
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {market === "1X2" && (["home", "draw", "away"] as const).map((p) => (
          <button key={p} onClick={() => setPick(p)} disabled={running}
            className={`py-2 rounded-lg text-xs font-bold capitalize ${pick === p ? "bg-wb-primary text-black" : "bg-wb-sub text-white"}`}>{p}</button>
        ))}
        {market === "OU" && (["over", "under"] as const).map((p) => (
          <button key={p} onClick={() => setPick(p)} disabled={running}
            className={`py-2 rounded-lg text-xs font-bold capitalize ${pick === p ? "bg-wb-primary text-black" : "bg-wb-sub text-white"}`}>{p} 2.5</button>
        ))}
        {market === "BTTS" && (["yes", "no"] as const).map((p) => (
          <button key={p} onClick={() => setPick(p)} disabled={running}
            className={`py-2 rounded-lg text-xs font-bold capitalize ${pick === p ? "bg-wb-primary text-black" : "bg-wb-sub text-white"}`}>{p}</button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} disabled={running} className="flex-1 rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white" />
        <button onClick={kickOff} disabled={loading || running || parseFloat(stake) < 10 || parseFloat(stake) > balance} className="flex-1 rounded-xl bg-wb-primary py-3 text-sm font-bold text-black disabled:opacity-40">
          {loading || running ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Kick Off"}
        </button>
      </div>

      {message && <p className="text-sm text-wb-primary font-semibold text-center">{message}</p>}
      <p className="mt-4 text-xs text-wb-muted text-center">Balance: {symbol} {balance.toFixed(2)}</p>
    </div>
  );
}
