import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";



export async function POST(req: Request) {
  const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

  try {
    const body = await req.text(); // Must use raw text for signature
    const signature = req.headers.get("x-paystack-signature");
    const secret = process.env.PAYSTACK_SECRET_KEY!;

    // 1. Verify HMAC SHA512 Signature
    const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
    
    // Use timingSafeEqual to prevent timing attacks [citation:3]
    const isValid = signature && crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
    
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    // 2. Handle Successful Charge
    if (event.event === "charge.success") {
      const { reference, amount, customer } = event.data;
      const amountGHS = amount / 100; // Convert pesewas to GHS

      // Find user by email (or reference if you store it)
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, available_balance, deposit_count")
        .eq("email", customer.email)
        .single();

      if (profile) {
        // Check if this reference was already processed (Idempotency)
        const { data: existingTx } = await supabaseAdmin
          .from("transactions")
          .select("id")
          .eq("reference", reference)
          .single();

        if (!existingTx) {
          // Credit Wallet
          await supabaseAdmin.from("profiles").update({
            available_balance: Number(profile.available_balance) + amountGHS,
            deposit_count: (profile.deposit_count || 0) + 1,
          }).eq("id", profile.id);

          // Log Transaction
          await supabaseAdmin.from("transactions").insert({
            user_id: profile.id, type: "deposit", amount: amountGHS, status: "completed", reference,
          });
        }
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
