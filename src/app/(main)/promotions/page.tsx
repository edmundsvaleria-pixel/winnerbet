"use client";

import { useState } from "react";
import { Gift, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";

export default function PromotionsPage() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);

  async function handleClaim() {
    setLoading(true);
    setMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: promo } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .single();

      if (!promo) throw new Error("Invalid or expired promo code.");

      // Add free bet to user's profile
      const { data: profile } = await supabase.from("profiles").select("free_bet_balance").eq("id", user.id).single();
      await supabase.from("profiles").update({
        free_bet_balance: Number(profile?.free_bet_balance || 0) + Number(promo.amount)
      }).eq("id", user.id);

      // Deactivate code
      await supabase.from("promo_codes").update({ is_active: false }).eq("id", promo.id);

      setClaimed(true);
      setMessage({ type: "success", text: `Promo claimed! GH₵${promo.amount} added to your Free Bet balance.` });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <Gift className="h-12 w-12 text-wb-primary mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-white">Promotions</h1>
        <p className="text-sm text-wb-muted">Claim free bets and welcome bonuses.</p>
      </div>

      <div className="rounded-2xl border border-wb-border bg-wb-surface p-6">
        <h2 className="text-sm font-bold text-white mb-4">Redeem Promo Code</h2>
        {claimed ? (
          <div className="flex items-center gap-2 text-wb-primary font-bold"><CheckCircle2 className="h-5 w-5" /> Promo Claimed!</div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="flex-1 rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white uppercase focus:border-wb-primary focus:outline-none"
            />
            <button onClick={handleClaim} disabled={loading || !code} className="rounded-xl bg-wb-primary px-6 py-3 text-sm font-bold text-black hover:bg-wb-primary-hover disabled:opacity-50">
              Claim
            </button>
          </div>
        )}
        {message && (
          <p className={`mt-3 text-sm flex items-center gap-1 ${message.type === "success" ? "text-wb-primary" : "text-wb-danger"}`}>
            {message.type === "error" && <AlertCircle className="h-4 w-4" />} {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
