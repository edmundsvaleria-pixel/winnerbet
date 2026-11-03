"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Match } from "@/lib/bsd";
import MatchCard from "@/components/sports/MatchCard";
import { Trophy, Dices, Wallet, ArrowRight, Zap, ChevronRight, Activity, Gift, Gamepad2 } from "lucide-react";
import { useUserStore } from "@/store/userStore";

export default function Home() {
  const loaded = useUserStore((s) => s.loaded);
  const isGuest = !loaded;

  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLive() {
      try {
        const res = await fetch("/api/sports");
        if (res.ok) {
          const data = await res.json();
          setLiveMatches(data.filter((m: Match) => m.status === "live").slice(0, 3));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLive();
  }, []);

  return (
    <div className="min-h-screen bg-wb-bg text-white pb-20">
      {/* Guest Header (only if not logged in) */}
      {isGuest && (
        <header className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-wb-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-wb-primary">
              <Trophy className="h-4 w-4 text-black" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              Winner<span className="text-wb-primary">bet</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-bold text-white hover:text-wb-primary px-4 py-2">Log In</Link>
            <Link href="/signup" className="rounded-full bg-wb-primary px-4 py-2 text-sm font-bold text-black hover:bg-wb-primary-hover">Sign Up</Link>
          </div>
        </header>
      )}

      {/* Quick Links Bar (SportyBet Style) */}
      <section className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-5 gap-2 sm:gap-4">
          {[
            { name: "Football", icon: "⚽", href: "/sports/football" },
            { name: "Basketball", icon: "🏀", href: "/sports/basketball" },
            { name: "Tennis", icon: "🎾", href: "/sports/tennis" },
            { name: "Virtuals", icon: "🎮", href: "/games" },
            { name: "Casino", icon: "🎰", href: "/games" },
          ].map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="flex flex-col items-center justify-center rounded-xl border border-wb-border bg-wb-surface p-2 hover:border-wb-primary transition"
            >
              <span className="text-2xl mb-1">{link.icon}</span>
              <span className="text-[10px] font-bold text-white text-center leading-tight">{link.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Jackpot Banner */}
      <section className="max-w-6xl mx-auto px-4 py-2">
        <Link href="/games" className="block relative overflow-hidden rounded-2xl border border-wb-primary/30 bg-gradient-to-r from-wb-surface to-wb-primary/10 p-5">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold text-wb-primary uppercase tracking-wider mb-1">Weekly Jackpot</p>
              <h3 className="text-xl font-black text-white">Win GH₵ 1,000,000</h3>
              <p className="text-xs text-wb-muted mt-1">Predict 12 matches correctly to win big.</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-wb-primary/20">
              <Gift className="h-6 w-6 text-wb-primary" />
            </div>
          </div>
        </Link>
      </section>

      {/* Live Now Section */}
      <section className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-wb-primary" />
            <h2 className="text-lg font-bold text-white">Live Now</h2>
          </div>
          <Link href="/sports/football" className="text-xs font-bold text-wb-primary hover:underline flex items-center">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-6 text-wb-muted text-sm">Loading live matches…</div>
        ) : liveMatches.length === 0 ? (
          <div className="text-center py-6 text-wb-muted text-sm rounded-xl border border-wb-border bg-wb-surface">
            No live matches right now. Check the upcoming schedule.
          </div>
        ) : (
          <div className="space-y-3">
            {liveMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onOpenDetails={() => {}} // No-op for home page
              />
            ))}
          </div>
        )}
      </section>

      {/* Instant Virtuals / Casino Highlight */}
      <section className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-wb-primary" />
            <h2 className="text-lg font-bold text-white">Instant Virtuals & Casino</h2>
          </div>
          <Link href="/games" className="text-xs font-bold text-wb-primary hover:underline flex items-center">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: "JetX", emoji: "🚀", href: "/games" },
            { name: "Mines", emoji: "💣", href: "/games" },
            { name: "Plinko", emoji: "🔴", href: "/games" },
            { name: "Virtual Football", emoji: "🏟️", href: "/games" },
          ].map((g) => (
            <Link key={g.name} href={g.href} className="flex flex-col items-center justify-center rounded-2xl border border-wb-border bg-wb-surface p-4 hover:border-wb-primary transition">
              <span className="text-3xl mb-2">{g.emoji}</span>
              <span className="text-xs font-bold text-center">{g.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Accumulator Bonus Promo */}
      <section className="max-w-6xl mx-auto px-4 py-4">
        <div className="rounded-2xl border border-wb-border bg-gradient-to-r from-wb-surface to-wb-bg p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-wb-primary uppercase tracking-wider mb-1">Accumulator Boost</p>
            <h3 className="text-lg font-bold text-white">Get up to 200% Bonus</h3>
            <p className="text-sm text-wb-muted mt-1">Add more selections to your bet slip and boost your winnings.</p>
          </div>
          <Link href="/sports/football" className="rounded-xl bg-wb-primary px-4 py-2 text-sm font-bold text-black hover:bg-wb-primary-hover">
            Bet Now
          </Link>
        </div>
      </section>
    </div>
  );
}