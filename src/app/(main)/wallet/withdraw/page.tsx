"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";

export default function WithdrawPage() {
  const router = useRouter();
  const symbol = useUserStore((s) => s.symbol);
  const withdrawable = useUserStore((s) => s.withdrawable);

  const [loading, setLoading] = useState(true);
  const [depositCount, setDepositCount] = useState(0);
  const [amount, setAmount] = useState("");
  const [momoNumber, setMomoNumber] = useState("");
  const [network, setNetwork] = useState("MTN");

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data } = await supabase.from("profiles").select("deposit_count").eq("id", user.id).single();
      if (data) setDepositCount(data.deposit_count || 0);
      setLoading(false);
    }
    loadProfile();
  }, [router]);

  const amountNum = parseFloat(amount) || 0;
  const hasMinDeposits = depositCount >= 3;
  const hasMinAmount = amountNum >= 10000;
  const hasSufficientFunds = amountNum <= withdrawable;
  const isValid = hasMinDeposits && hasMinAmount && hasSufficientFunds && momoNumber.length >= 10;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    alert(`Withdrawal request for ${symbol}${amountNum.toLocaleString()} submitted to ${network} (${momoNumber}). Processing within 24 hours.`);
    router.push("/wallet");
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-wb-primary" /></div>;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/wallet" className="rounded-lg p-2 bg-wb-surface text-wb-muted hover:text-white transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-white">Withdraw Funds</h1>
      </div>

      <div className="rounded-2xl border border-wb-border bg-wb-surface p-5 mb-6">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-wb-muted">Withdrawable Balance</span>
          <span className="text-lg font-bold text-wb-primary">{symbol} {withdrawable.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-wb-muted">Deposits Made</span>
          <span className={hasMinDeposits ? "text-wb-primary font-bold" : "text-wb-danger font-bold"}>
            {depositCount} / 3 (Required)
          </span>
        </div>
      </div>

      {!hasMinDeposits && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-wb-danger/30 bg-wb-danger/10 p-4">
          <AlertCircle className="h-5 w-5 text-wb-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-wb-danger">Withdrawal Locked</p>
            <p className="text-xs text-wb-danger/80 mt-1">You must make at least 3 deposits before you can withdraw funds.</p>
            <Link href="/wallet" className="mt-2 inline-block text-xs font-bold text-white bg-wb-danger/20 px-3 py-1.5 rounded hover:bg-wb-danger/30">
              Make a Deposit
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-wb-muted uppercase mb-1.5">Amount ({symbol})</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Min 10,000" disabled={!hasMinDeposits} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white placeholder:text-wb-muted focus:border-wb-primary focus:outline-none disabled:opacity-50" />
          {amountNum > 0 && !hasMinAmount && <p className="text-xs text-wb-danger mt-1">Minimum withdrawal is {symbol} 10,000</p>}
          {amountNum > withdrawable && <p className="text-xs text-wb-danger mt-1">Amount exceeds withdrawable balance</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-wb-muted uppercase mb-1.5">Mobile Money Network</label>
          <select value={network} onChange={(e) => setNetwork(e.target.value)} disabled={!hasMinDeposits} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white focus:border-wb-primary focus:outline-none disabled:opacity-50">
            <option value="MTN">MTN Mobile Money</option>
            <option value="Telecel">Telecel Cash</option>
            <option value="AirtelTigo">AirtelTigo Money</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-wb-muted uppercase mb-1.5">Mobile Money Number</label>
          <input type="tel" value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} placeholder="e.g. 0551234567" disabled={!hasMinDeposits} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white placeholder:text-wb-muted focus:border-wb-primary focus:outline-none disabled:opacity-50" />
        </div>

        <button type="submit" disabled={!isValid} className="w-full rounded-xl bg-wb-primary py-3.5 text-sm font-bold text-black transition hover:bg-wb-primary-hover disabled:cursor-not-allowed disabled:opacity-40 mt-6">
          Request Withdrawal
        </button>
      </form>
    </div>
  );
}