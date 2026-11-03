"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
// @ts-ignore
import PaystackPop from "@paystack/inline-js";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";

export default function DepositModal({ onClose }: { onClose: () => void }) {
  const symbol = useUserStore((s) => s.symbol);
  const addBalance = useUserStore((s) => s.addBalance);

  const [amount, setAmount] = useState<string>("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNum = parseFloat(amount) || 0;
  const valid = amountNum >= 200;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

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
        onSuccess: async (transaction: any) => { // Explicitly typed 'any'
          try {
            await supabase.from("transactions").insert({
              user_id: user.id,
              type: "deposit",
              amount: amountNum,
              status: "completed",
              reference: transaction.reference,
            });

            const { data: profile } = await supabase
              .from("profiles")
              .select("available_balance, deposit_count")
              .eq("id", user.id)
              .single();

            if (profile) {
              await supabase
                .from("profiles")
                .update({
                  available_balance: Number(profile.available_balance) + amountNum,
                  deposit_count: (profile.deposit_count || 0) + 1,
                })
                .eq("id", user.id);
            }

            addBalance(amountNum);
            onClose();
          } catch (err) {
            console.error("Error updating balance:", err);
            setError("Payment successful, but failed to update balance. Please contact support.");
          }
        },
        onCancel: () => {
          setLoading(false);
        },
      });
    } catch (err: any) {
      console.error(err);
      setError("Failed to open Paystack. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#333333] bg-[#1A1A1A] p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Deposit Funds</h2>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-white disabled:opacity-50 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Minimum deposit is {symbol} 200. Pay securely via Mobile Money or Card.
        </p>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">
          Amount ({symbol})
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="200"
          min={200}
          className="w-full rounded-xl border border-[#444444] bg-[#2A2A2A] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-[#00C853] focus:outline-none mb-4 font-semibold"
        />

        <div className="flex gap-2 mb-6">
          {[200, 500, 1000, 5000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setAmount(String(amt))}
              className="flex-1 rounded-xl border border-[#444444] bg-[#0A0A0A] py-2 text-xs font-bold text-white hover:border-[#00C853] hover:text-[#00C853] transition"
            >
              {symbol}{amt}
            </button>
          ))}
        </div>

        <button
          onClick={handleProceed}
          disabled={!valid || loading || !email}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00C853] py-3.5 text-sm font-bold text-black transition hover:bg-[#00E676] disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Processing…" : `Proceed to Pay ${symbol}${amountNum > 0 ? amountNum.toFixed(0) : ""}`}
        </button>
      </div>
    </div>
  );
}