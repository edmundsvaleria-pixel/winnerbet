"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
// @ts-ignore
import PaystackPop from "@paystack/inline-js";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import Toast from "@/components/ui/Toast";

export default function DepositModal({ onClose }: { onClose: () => void }) {
  const symbol = useUserStore((s) => s.symbol);
  const addBalance = useUserStore((s) => s.addBalance);

  const [amount, setAmount] = useState<string>("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const amountNum = parseFloat(amount) || 0;
  const valid = amountNum >= 200;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  async function checkBalance() {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("available_balance, withdrawable_balance").eq("id", user.id).single();
      if (profile) {
        const newBal = Number(profile.available_balance);
        if (newBal > useUserStore.getState().balance) {
          useUserStore.getState().setBalances(newBal, Number(profile.withdrawable_balance));
          clearInterval(interval);
          onClose();
        }
      }

      if (attempts >= 5) {
        clearInterval(interval);
        setToast({ msg: "Payment received, balance updating. Refresh in a few minutes.", type: "success" });
        setTimeout(onClose, 3000);
      }
    }, 3000);
  }

  async function handleProceed() {
    if (!valid || !email) return;
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const paystack = new PaystackPop();
      
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: email,
        amount: Math.round(amountNum * 100),
        currency: "GHS",
        onSuccess: async (transaction: any) => {
          setLoading(false);
          setVerifying(true);
          checkBalance();
        },
        onCancel: () => setLoading(false),
      });
    } catch (err: any) {
      setError("Failed to open Paystack.");
      setLoading(false);
    }
  }

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-wb-border bg-wb-surface p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Deposit Funds</h2>
            <button onClick={onClose} disabled={loading || verifying} className="text-wb-muted hover:text-white disabled:opacity-50"><X className="h-5 w-5" /></button>
          </div>

          {verifying ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-wb-primary mb-4" />
              <h3 className="text-lg font-bold text-white">Verifying Payment...</h3>
              <p className="text-xs text-wb-muted mt-2">Waiting for Paystack confirmation.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-wb-muted mb-4">Minimum deposit is {symbol} 200.</p>
              {error && <p className="text-sm text-wb-danger mb-4">{error}</p>}
              
              <label className="block text-xs font-bold uppercase tracking-wide text-wb-muted mb-1.5">Amount ({symbol})</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="200" min={200} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white placeholder:text-wb-muted focus:border-wb-primary focus:outline-none mb-4 font-semibold" />

              <div className="flex gap-2 mb-6">
                {[200, 500, 1000, 5000].map((amt) => (
                  <button key={amt} type="button" onClick={() => setAmount(String(amt))} className="flex-1 rounded-xl border border-wb-border-strong bg-wb-bg py-2 text-xs font-bold text-white hover:border-wb-primary hover:text-wb-primary transition">{symbol}{amt}</button>
                ))}
              </div>

              <button onClick={handleProceed} disabled={!valid || loading || !email} className="flex w-full items-center justify-center gap-2 rounded-xl bg-wb-primary py-3.5 text-sm font-bold text-black transition hover:bg-wb-primary-hover disabled:opacity-50">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Processing…" : `Proceed to Pay ${symbol}${amountNum > 0 ? amountNum.toFixed(0) : ""}`}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
