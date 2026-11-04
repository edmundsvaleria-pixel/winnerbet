"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { Loader2, ArrowDownLeft, ArrowUpRight, Receipt, Trophy } from "lucide-react";

export default function HistoryPage() {
  const symbol = useUserStore((s) => s.symbol);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) setTransactions(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-wb-primary" /></div>;

  const getIcon = (type: string) => {
    if (type === "deposit") return <ArrowDownLeft className="h-5 w-5 text-wb-primary" />;
    if (type === "withdrawal") return <ArrowUpRight className="h-5 w-5 text-wb-danger" />;
    if (type === "bet") return <Receipt className="h-5 w-5 text-wb-muted" />;
    if (type === "win") return <Trophy className="h-5 w-5 text-wb-primary" />;
    return <Receipt className="h-5 w-5 text-wb-muted" />;
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-6">Transaction History</h1>

      <div className="space-y-3">
        {transactions.length === 0 ? (
          <p className="text-center py-10 text-wb-muted">No transactions yet.</p>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-xl border border-wb-border bg-wb-surface p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tx.type === 'deposit' || tx.type === 'win' ? 'bg-wb-primary/10' : 'bg-wb-sub'}`}>
                  {getIcon(tx.type)}
                </div>
                <div>
                  <p className="text-sm font-bold text-white capitalize">{tx.type.replace('_', ' ')}</p>
                  <p className="text-xs text-wb-muted">{new Date(tx.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold tabular-nums ${tx.type === 'deposit' || tx.type === 'win' ? 'text-wb-primary' : 'text-white'}`}>
                  {tx.type === 'deposit' || tx.type === 'win' ? '+' : '-'} {symbol} {Number(tx.amount).toFixed(2)}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-wb-muted">{tx.status}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
