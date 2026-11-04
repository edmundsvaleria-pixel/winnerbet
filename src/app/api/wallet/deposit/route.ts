import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";



export async function POST(req: Request) {
  const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.PAYSTACK_SECRET_KEY!
);

  try {
    const { userId, reference, amount } = await req.json();

    if (!userId || !reference || !amount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify with Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== "success") {
      return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
    }

    // Paystack amount is in pesewas, we stored GHS
    const verifiedAmount = paystackData.data.amount / 100;
    if (Math.abs(verifiedAmount - amount) > 0.01) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("available_balance, deposit_count")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Credit balance and increment deposit_count
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        available_balance: Number(profile.available_balance) + amount,
        deposit_count: (profile.deposit_count || 0) + 1,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: "Failed to credit wallet" }, { status: 500 });
    }

    // Record transaction
    await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type: "deposit",
      amount,
      status: "completed",
      reference,
    });

    return NextResponse.json({ success: true, newBalance: Number(profile.available_balance) + amount });
  } catch (err) {
    console.error("Deposit API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

