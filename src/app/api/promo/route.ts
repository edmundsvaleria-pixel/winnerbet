import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";



export async function POST(req: Request) {
  const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

  try {
    const { code, amount } = await req.json();
    if (!code || !amount) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const { error } = await supabaseAdmin.from("promo_codes").insert({
      code: code.toUpperCase(),
      amount: Number(amount),
      is_active: true,
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

