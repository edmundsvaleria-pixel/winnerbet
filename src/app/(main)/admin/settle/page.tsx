"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function BulkSettlePage() {
  const router = useRouter();
  const symbol = useUserStore((s) => s.symbol);
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin") return router.push("/sports/football");

      const { data } = await supabase
        .from("bets")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (data) setBets(data);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSettle(betId: number, outcome: "won" | "lost") {
    setLoading(true);
    await fetch("/api/admin/settle-bet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ betId, outcome }),
    });
    setBets((prev) => prev.filter((b) => b.id !== betId));
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-wb-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Bulk Settle Bets</h1>
      
      <div className="space-y-4">
        {bets.length === 0 ? (
          <p className="text-center text-wb-muted py-10">All bets are settled.</p>
        ) : (
          bets.map((bet) => (
            <div key={bet.id} className="rounded-xl border border-wb-border bg-wb-surface p-4">
              <div className="flex items-center justify-between border-b border-wb-border pb-2 mb-2">
                <span className="text-xs font-bold text-wb-primary">{bet.booking_code}</span>
                <span className="text-xs text-wb-muted">Stake: {symbol} {Number(bet.stake).toFixed(2)}</span>
              </div>
              
              {/* Display Selections */}
              <div className="space-y-1 mb-4">
                {bet.selections?.map((sel: any, idx: number) => (
                  <div key={idx} className="text-xs text-white flex justify-between">
                    <span>{sel.matchLabel} — <span className="text-wb-primary">{sel.pick}</span></span>
                    <span className="font-bold">{sel.odd}×</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => handleSettle(bet.id, "won")} className="flex items-center gap-1 rounded-lg bg-wb-primary/10 px-4 py-2 text-xs font-bold text-wb-primary hover:bg-wb-primary/20">
                  <CheckCircle className="h-4 w-4" /> Mark Won
                </button>
                <button onClick={() => handleSettle(bet.id, "lost")} className="flex items-center gap-1 rounded-lg bg-wb-danger/10 px-4 py-2 text-xs font-bold text-wb-danger hover:bg-wb-danger/20">
                  <XCircle className="h-4 w-4" /> Mark Lost
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
