"use client";

import { useState, useEffect } from "react";
import nextDynamic from "next/dynamic"; // Renamed to fix the conflict
import { useUserStore } from "@/store/userStore";
import { Wallet, TrendingUp, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

// Force this page to be dynamic to avoid build-time prerendering errors
export const dynamic = 'force-dynamic';

// Load DepositModal only on the client side
const DepositModal = nextDynamic(() => import("@/components/wallet/DepositModal"), { 
  ssr: false 
});

export default function WalletPage() {
  const symbol = useUserStore((s) => s.symbol);
  const balance = useUserStore((s) => s.balance);
  const withdrawable = useUserStore((s) => s.withdrawable);
  const loaded = useUserStore((s) => s.loaded);
  const setBalances = useUserStore((s) => s.setBalances);

  const [showDeposit, setShowDeposit] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function syncBalance() {
      setRefreshing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("available_balance, withdrawable_balance")
        .eq("id", user.id)
        .single();

      if (profile) {
        setBalances(Number(profile.available_balance), Number(profile.withdrawable_balance));
      }
      setRefreshing(false);
    }
    syncBalance();
  }, [setBalances]);

  if (!loaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-wb-muted">Loading wallet…</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Wallet</h1>
        {refreshing && <Loader2 className="h-5 w-5 animate-spin text-wb-primary" />}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        <div className="rounded-2xl border border-wb-border bg-wb-surface p-5">
          <div className="flex items-center gap-2 text-wb-muted text-xs uppercase tracking-wide mb-1">
            <Wallet className="h-4 w-4" /> Available Balance
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">
            {symbol} {balance.toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl border border-wb-border bg-wb-surface p-5">
          <div className="flex items-center gap-2 text-wb-muted text-xs uppercase tracking-wide mb-1">
            <TrendingUp className="h-4 w-4" /> Withdrawable
          </div>
          <p className="text-2xl font-bold text-wb-primary tabular-nums">
            {symbol} {withdrawable.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setShowDeposit(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-wb-primary py-3 text-sm font-bold text-black transition hover:bg-wb-primary-hover"
        >
          <Plus className="h-4 w-4" /> Deposit
        </button>
        <Link
          href="/wallet/withdraw"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-wb-border-strong bg-wb-surface py-3 text-sm font-bold text-white transition hover:border-wb-primary"
        >
          Withdraw
        </Link>
      </div>

      <p className="mt-4 text-xs text-wb-muted text-center">
        Minimum deposit: {symbol} 200 · Minimum withdrawal: {symbol} 10,000
      </p>

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
    </div>
  );
}