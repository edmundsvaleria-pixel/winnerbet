import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest("hex");

    if (hash !== signature) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const { reference, amount, customer } = event.data;
      const amountGHS = amount / 100;

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, available_balance, bonus_balance, deposit_count")
        .eq("email", customer.email)
        .single();

      if (profile) {
        const isFirstDeposit = (profile.deposit_count || 0) === 0;
        let bonusAmount = isFirstDeposit ? amountGHS * 0.5 : 0;

        await supabaseAdmin.from("profiles").update({
          available_balance: Number(profile.available_balance) + amountGHS,
          bonus_balance: Number(profile.bonus_balance || 0) + bonusAmount,
          deposit_count: (profile.deposit_count || 0) + 1,
        }).eq("id", profile.id);

        await supabaseAdmin.from("transactions").insert({
          user_id: profile.id, type: "deposit", amount: amountGHS, status: "completed", reference,
        });

        if (bonusAmount > 0) {
          await supabaseAdmin.from("transactions").insert({
            user_id: profile.id, type: "bonus", amount: bonusAmount, status: "completed", reference: `BONUS-${reference}`,
          });
        }

        // Handle Referral Commission
        const { data: referral } = await supabaseAdmin
          .from("referrals")
          .select("id, referrer_id, commission_paid")
          .eq("referred_id", profile.id)
          .eq("commission_paid", false)
          .single();

        if (referral && !referral.commission_paid) {
          const { data: referrer } = await supabaseAdmin.from("profiles").select("available_balance").eq("id", referral.referrer_id).single();
          if (referrer) {
            await supabaseAdmin.from("profiles").update({
              available_balance: Number(referrer.available_balance) + 20,
            }).eq("id", referral.referrer_id);

            await supabaseAdmin.from("transactions").insert({
              user_id: referral.referrer_id, type: "commission", amount: 20, status: "completed", reference: `REF-${referral.id}`,
            });
            
            await supabaseAdmin.from("referrals").update({ commission_paid: true, status: "completed" }).eq("id", referral.id);
          }
        }
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}