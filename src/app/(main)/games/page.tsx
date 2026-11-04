"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useCasinoAccess } from "@/hooks/useCasinoAccess";
import AccessDenied from "@/components/ui/AccessDenied";
import JetX from "@/components/games/JetX";
import Mines from "@/components/games/Mines";
import Dice from "@/components/games/Dice";
import Plinko from "@/components/games/Plinko";
import Keno from "@/components/games/Keno";
import Penalty from "@/components/games/Penalty";
import Spin from "@/components/games/Spin";
import Hotline from "@/components/games/Hotline";
import HorseRacing from "@/components/games/HorseRacing";
import VirtualFootball from "@/components/games/VirtualFootball";

type GameKey =
  | "jetx" | "mines" | "dice" | "plinko" | "keno" | "penalty" | "spin" | "hotline" | "horseracing" | "virtualfootball";

type GameDef = {
  key: GameKey;
  name: string;
  emoji: string;
  desc: string;
};

const games: GameDef[] = [
  { key: "jetx", name: "JetX", emoji: "🚀", desc: "Cash out before crash" },
  { key: "mines", name: "Mines", emoji: "💣", desc: "5×5, 3 mines" },
  { key: "dice", name: "Dice", emoji: "🎲", desc: "Roll over/under" },
  { key: "plinko", name: "Plinko", emoji: "🔴", desc: "Drop the ball" },
  { key: "keno", name: "Keno", emoji: "🔢", desc: "Pick 10 numbers" },
  { key: "penalty", name: "Penalty", emoji: "⚽", desc: "Beat the keeper" },
  { key: "spin", name: "Lucky Spin", emoji: "🎡", desc: "Spin the wheel" },
  { key: "hotline", name: "Hotline", emoji: "🎰", desc: "3-reel slot" },
  { key: "horseracing", name: "Horse Racing", emoji: "🐎", desc: "Pick the winner" },
  { key: "virtualfootball", name: "Virtual Football", emoji: "🏟️", desc: "30-sec match" },
];

const CATEGORIES: { title: string; keys: GameKey[] }[] = [
  { title: "Crash & Multiplier", keys: ["jetx", "mines", "penalty"] },
  { title: "Dice & Numbers", keys: ["dice", "keno", "plinko"] },
  { title: "Slots & Wheels", keys: ["hotline", "spin"] },
  { title: "Racing & Sports", keys: ["horseracing", "virtualfootball"] },
];

export default function GamesPage() {
  const [active, setActive] = useState<GameKey | null>(null);
  const { hasAccess, loading, stats } = useCasinoAccess();

  if (loading) return <div className="flex h-[60vh] items-center justify-center text-wb-muted">Checking access...</div>;
  
  // Show lock screen if requirements not met
  if (!hasAccess) return <AccessDenied stats={stats} />;

  if (active) {
    const GameComponent = {
      jetx: JetX, mines: Mines, dice: Dice, plinko: Plinko, keno: Keno,
      penalty: Penalty, spin: Spin, hotline: Hotline, horseracing: HorseRacing, virtualfootball: VirtualFootball,
    }[active];

    const activeGame = games.find((g) => g.key === active);

    return (
      <div className="min-h-screen bg-wb-bg">
        <div className="sticky top-16 z-30 flex items-center gap-3 border-b border-wb-border bg-wb-bg/95 px-4 py-3 backdrop-blur">
          <button onClick={() => setActive(null)} className="flex items-center gap-1.5 rounded-lg bg-wb-surface px-3 py-2 text-sm font-medium text-white transition hover:bg-wb-sub">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h2 className="text-sm font-bold uppercase tracking-wide text-wb-muted">{activeGame?.name}</h2>
        </div>
        <div className="px-4 py-6"><GameComponent /></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-white mb-6">Casino Games</h1>
      <div className="space-y-8">
        {CATEGORIES.map((cat) => {
          const catGames = cat.keys.map((k) => games.find((g) => g.key === k)).filter(Boolean) as GameDef[];
          return (
            <div key={cat.title}>
              <h2 className="text-sm font-bold text-wb-muted uppercase tracking-wider mb-3">{cat.title}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {catGames.map((game) => (
                  <button
                    key={game.key}
                    onClick={() => setActive(game.key)}
                    className="flex flex-col items-start rounded-xl border border-wb-border bg-wb-surface p-4 text-left transition hover:border-wb-primary"
                  >
                    <span className="text-3xl mb-2">{game.emoji}</span>
                    <span className="text-sm font-bold text-white">{game.name}</span>
                    <span className="text-xs text-wb-muted mt-0.5">{game.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}