"use client";

import Link from "next/link";
import { Gamepad2, Trophy, Timer, Zap } from "lucide-react";
import { useCasinoAccess } from "@/hooks/useCasinoAccess";
import AccessDenied from "@/components/ui/AccessDenied";

export default function VirtualsPage() {
  const { hasAccess, loading, stats } = useCasinoAccess();

  if (loading) return <div className="flex h-[60vh] items-center justify-center text-wb-muted">Checking access...</div>;
  if (!hasAccess) return <AccessDenied stats={stats} />;

  const virtuals = [
    { name: "Virtual Football", desc: "30-second match sim", icon: Trophy, href: "/games", color: "bg-green-500/10 text-green-400" },
    { name: "Penalty Shootout", desc: "Fast goals betting", icon: Zap, href: "/games", color: "bg-yellow-500/10 text-yellow-400" },
    { name: "Horse Racing", desc: "6-horse sprint", icon: Timer, href: "/games", color: "bg-blue-500/10 text-blue-400" },
    { name: "Instant Crash", desc: "JetX multiplier", icon: Gamepad2, href: "/games", color: "bg-purple-500/10 text-purple-400" },
  ];

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Virtual Sports</h1>
        <p className="text-wb-muted text-sm mt-1">Bet 24/7 on fast-paced simulated events.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {virtuals.map((v) => (
          <Link key={v.name} href={v.href} className="flex items-center gap-4 rounded-2xl border border-wb-border bg-wb-surface p-5 hover:border-wb-primary transition">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${v.color}`}>
              <v.icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{v.name}</h3>
              <p className="text-xs text-wb-muted">{v.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}