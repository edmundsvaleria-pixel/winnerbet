"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Plus, Receipt, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { useBetSlipStore } from "@/store/betSlip";

export default function Header({ username, isGuest = false }: { username: string; isGuest?: boolean }) {
  const router = useRouter();
  const balance = useUserStore((s) => s.balance);
  const symbol = useUserStore((s) => s.symbol);
  const resetUser = useUserStore((s) => s.reset);
  const clearSlip = useBetSlipStore((s) => s.clearSlip);

  const [menuOpen, setMenuOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const prevBalance = useRef(balance);

  useEffect(() => {
    if (prevBalance.current !== balance) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      prevBalance.current = balance;
      return () => clearTimeout(t);
    }
  }, [balance]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  async function handleLogout() {
    await supabase.auth.signOut();
    resetUser();
    clearSlip();
    router.replace("/login");
  }

  const formatted = balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-wb-border bg-wb-bg/95 backdrop-blur">
      <div className="flex h-full items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-wb-primary text-black font-black">
            W
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white hidden sm:block">
            Rigged<span className="text-wb-primary">Win</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {isGuest ? (
            <>
              <Link href="/login" className="text-sm font-bold text-white hover:text-wb-primary px-2 py-2">Log In</Link>
              <Link href="/signup" className="rounded-full bg-wb-primary px-4 py-2 text-sm font-bold text-black hover:bg-wb-primary-hover">Sign Up</Link>
            </>
          ) : (
            <>
              <div className={`flex items-center gap-2 rounded-full border border-wb-border-strong bg-wb-surface px-3 py-1.5 transition ${pulse ? "border-wb-primary" : ""}`}>
                <Wallet className="h-3.5 w-3.5 text-wb-primary" />
                <span className={`text-sm font-bold tabular-nums ${pulse ? "text-wb-primary" : "text-white"}`}>
                  {symbol} {formatted}
                </span>
              </div>

              <div className="relative" ref={menuRef}>
                <button type="button" onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-1.5 rounded-full border border-wb-border-strong bg-wb-surface px-1.5 py-1.5 transition hover:border-wb-primary">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wb-primary text-xs font-black text-black">
                    {username?.[0]?.toUpperCase() ?? "U"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-wb-muted" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-wb-border-strong bg-wb-surface shadow-2xl animate-fade-up">
                    <div className="border-b border-wb-border px-4 py-3">
                      <p className="text-xs uppercase text-wb-muted">Signed in as</p>
                      <p className="truncate text-sm font-bold text-white">@{username}</p>
                    </div>
                    <Link href="/my-bets" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-wb-sub"><Receipt className="h-4 w-4 text-wb-muted" /> My Bets</Link>
                    <Link href="/wallet" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-wb-sub"><Wallet className="h-4 w-4 text-wb-muted" /> Wallet</Link>
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 border-t border-wb-border px-4 py-2.5 text-left text-sm text-wb-danger hover:bg-wb-sub"><LogOut className="h-4 w-4" /> Log Out</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}