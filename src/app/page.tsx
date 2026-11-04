"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Match } from "@/lib/bsd";
import MatchCard from "@/components/sports/MatchCard";
import { Trophy, Dices, Wallet, ArrowRight, Zap, ChevronRight, Activity } from "lucide-react";
import { useUserStore } from "@/store/userStore";

export default function Home() {
  const loaded = useUserStore((s) => s.loaded);
  const isGuest = !loaded;
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sports?sport=football")
      .then(res => res.json())
      .then(data => setLiveMatches(data.filter((m: Match) => m.status === "live").slice(0, 3)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-wb-bg text-white pb-20">
      {isGuest && (
        <header className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-wb-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-wb-primary text-black font-black">
              W
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              Rigged<span className="text-wb-primary">Win</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-bold text-white hover:text-wb-primary px-4 py-2">Log In</Link>
            <Link href="/signup" className="rounded-full bg-wb-primary px-4 py-2 text-sm font-bold text-black hover:bg-wb-primary-hover">Sign Up</Link>
          </div>
        </header>
      )}

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-4 py-20 text-center max-w-4xl mx-auto">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-wb-primary/10 px-4 py-1.5 text-xs font-bold text-wb-primary">
          <Zap className="h-3.5 w-3.5" /> Fast Deposits · Instant Payouts
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
          Bet on Football.<br />
          <span className="text-wb-primary">Win Big.</span>
        </h1>
        <p className="text-wb-muted text-lg mb-8 max-w-lg">
          Live odds, casino games, and instant withdrawals. Join RiggedWin and experience the thrill.
        </p>
        <div className="flex gap-4">
          <Link href="/sports/football" className="flex items-center gap-2 rounded-xl bg-wb-primary px-6 py-3 text-sm font-bold text-black hover:bg-wb-primary-hover">
            Browse Sports <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/games" className="flex items-center gap-2 rounded-xl border border-wb-border-strong bg-wb-surface px-6 py-3 text-sm font-bold text-white hover:border-wb-primary">
            Try Games <Dices className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Live Now Section */}
      <section className="max-w-6xl mx-auto px-4 py-6">
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
            No live matches right now.
          </div>
        ) : (
          <div className="space-y-3">
            {liveMatches.map((match) => (
              <MatchCard key={match.id} match={match} onOpenDetails={() => {}} />
            ))}
          </div>
        )}
      </section>

      {/* Top Games Preview */}
      <section className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Top Casino Games</h2>
          <Link href="/games" className="text-xs font-bold text-wb-primary hover:underline flex items-center">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: "JetX", emoji: "🚀", href: "/games" },
            { name: "Mines", emoji: "💣", href: "/games" },
            { name: "Plinko", emoji: "🔴", href: "/games" },
            { name: "Dice", emoji: "🎲", href: "/games" },
          ].map((g) => (
            <Link key={g.name} href={g.href} className="flex flex-col items-center justify-center rounded-2xl border border-wb-border bg-wb-surface p-6 hover:border-wb-primary transition">
              <span className="text-4xl mb-3">{g.emoji}</span>
              <span className="text-sm font-bold">{g.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}