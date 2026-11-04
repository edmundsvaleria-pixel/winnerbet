"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { ArrowLeft, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

export const dynamic = 'force-dynamic';

const MIN_WITHDRAWAL = 10000;
const COMMISSION_RATE = 0.10; // 10%

export default function WithdrawPage() {
  const router = useRouter();
  const symbol = useUserStore((s) => s.symbol);
  const withdrawable = useUserStore((s) => s.withdrawable);

  const [loading, setLoading] = useState(true);
  const [depositCount, setDepositCount] = useState(0);
  const [kycStatus, setKycStatus] = useState("unverified");
  const [amount, setAmount] = useState("");
  const [momoNumber, setMomoNumber] = useState("");
  const [network, setNetwork] = useState("MTN");
  
  const [step, setStep] = useState<"form" | "pay_commission" | "success">("form");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data } = await supabase.from("profiles").select("deposit_count, kyc_status").eq("id", user.id).single();
      if (data) {
        setDepositCount(data.deposit_count || 0);
        setKycStatus(data.kyc_status || "unverified");
      }
      setLoading(false);
    }
    loadProfile();
  }, [router]);

  const amountNum = parseFloat(amount) || 0;
  const commission = amountNum * COMMISSION_RATE;
  
  const hasMinDeposits = depositCount >= 3;
  const isVerified = kycStatus === "verified";
  const hasMinAmount = amountNum >= MIN_WITHDRAWAL;
  const hasSufficientFunds = amountNum <= withdrawable;
  const isValid = hasMinDeposits && isVerified && hasMinAmount && hasSufficientFunds && momoNumber.length >= 10;

  function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setStep("pay_commission");
  }

  async function handlePayCommission() {
    setPaying(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const PaystackPop = (await import("@paystack/inline-js")).default;
    const paystack = new PaystackPop();
    
    paystack.newTransaction({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: user.email!,
      amount: Math.round(commission * 100), // Convert GHS to Pesewas
      currency: "GHS",
      onSuccess: async (transaction: { reference: string }) => {
        await supabase.from("transactions").insert({
          user_id: user.id, type: "commission", amount: commission, status: "completed", reference: transaction.reference,
        });

        const { error } = await supabase.from("withdrawal_requests").insert({
          user_id: user.id, amount: amountNum, commission_amount: commission, momo_number: momoNumber, network: network, status: "pending_admin",
        });

        if (!error) setStep("success");
        else alert("Error creating withdrawal request: " + error.message);
        
        setPaying(false);
      },
      onCancel: () => setPaying(false),
    });
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-wb-primary" /></div>;

  if (step === "success") {
    return (
      <div className="px-4 py-20 max-w-lg mx-auto text-center">
        <CheckCircle2 className="h-16 w-16 text-wb-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Request Submitted!</h1>
        <p className="text-sm text-wb-muted mb-6">Your commission has been paid. The Admin will process your withdrawal shortly.</p>
        <Link href="/wallet" className="rounded-xl bg-wb-primary px-6 py-3 text-sm font-bold text-black hover:bg-wb-primary-hover transition">Back to Wallet</Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/wallet" className="rounded-lg p-2 bg-wb-surface text-wb-muted hover:text-white transition"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-xl font-bold text-white">Withdraw Funds</h1>
      </div>

      {step === "form" && (
        <>
          <div className="rounded-2xl border border-wb-border bg-wb-surface p-5 mb-6">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-wb-muted">Withdrawable Balance</span>
              <span className="text-lg font-bold text-wb-primary">{symbol} {withdrawable.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs mt-2">
              <span className="text-wb-muted">Deposits Made</span>
              <span className={hasMinDeposits ? "text-wb-primary font-bold" : "text-wb-danger font-bold"}>{depositCount} / 3</span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-wb-muted">KYC Status</span>
              <span className={isVerified ? "text-wb-primary font-bold" : "text-wb-danger font-bold capitalize"}>{kycStatus}</span>
            </div>
          </div>

          {(!hasMinDeposits || !isVerified) && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-wb-danger/30 bg-wb-danger/10 p-4">
              <AlertCircle className="h-5 w-5 text-wb-danger shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-wb-danger">Withdrawal Locked</p>
                <p className="text-xs text-wb-danger/80 mt-1">
                  {!hasMinDeposits && `You need 3 deposits. `} 
                  {!isVerified && `You must verify your identity (KYC).`}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-wb-muted uppercase mb-1.5">Amount ({symbol})</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Min ${MIN_WITHDRAWAL}`} disabled={!hasMinDeposits || !isVerified} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white placeholder:text-wb-muted focus:border-wb-primary focus:outline-none disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-wb-muted uppercase mb-1.5">Mobile Money Network</label>
              <select value={network} onChange={(e) => setNetwork(e.target.value)} disabled={!hasMinDeposits || !isVerified} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white focus:border-wb-primary focus:outline-none disabled:opacity-50">
                <option value="MTN">MTN Mobile Money</option>
                <option value="Telecel">Telecel Cash</option>
                <option value="AirtelTigo">AirtelTigo Money</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-wb-muted uppercase mb-1.5">Mobile Money Number</label>
              <input type="tel" value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} placeholder="e.g. 0551234567" disabled={!hasMinDeposits || !isVerified} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white placeholder:text-wb-muted focus:border-wb-primary focus:outline-none disabled:opacity-50" />
            </div>
            <button type="submit" disabled={!isValid} className="w-full rounded-xl bg-wb-primary py-3.5 text-sm font-bold text-black transition hover:bg-wb-primary-hover disabled:cursor-not-allowed disabled:opacity-40 mt-6">
              Continue to Commission
            </button>
          </form>
        </>
      )}

      {step === "pay_commission" && (
        <div className="rounded-2xl border border-wb-border bg-wb-surface p-6 text-center animate-fade-up">
          <h2 className="text-lg font-bold text-white mb-2">Commission Required</h2>
          <p className="text-sm text-wb-muted mb-6">A 10% commission is required to process your withdrawal to the Admin.</p>
          
          <div className="bg-wb-bg rounded-xl p-4 mb-6 border border-wb-border">
            <p className="text-xs text-wb-muted uppercase">Withdrawal Amount</p>
            <p className="text-xl font-bold text-white">{symbol} {amountNum.toFixed(2)}</p>
            <div className="h-px bg-wb-border my-3" />
            <p className="text-xs text-wb-muted uppercase">Commission Fee (10%)</p>
            <p className="text-2xl font-black text-wb-primary">{symbol} {commission.toFixed(2)}</p>
          </div>

          <button onClick={handlePayCommission} disabled={paying} className="w-full flex items-center justify-center gap-2 rounded-xl bg-wb-primary py-3.5 text-sm font-bold text-black transition hover:bg-wb-primary-hover disabled:opacity-50">
            {paying ? <Loader2 className="h-5 w-5 animate-spin" /> : `Pay ${symbol} ${commission.toFixed(2)} Commission`}
          </button>
          <button onClick={() => setStep("form")} disabled={paying} className="mt-3 text-xs font-bold text-wb-muted hover:text-white">Cancel</button>
        </div>
      )}
    </div>
  );
}