"use client";

import { useState } from "react";
import { ArrowLeft, Bomb, Circle, Dices, Disc, Flag, Goal, Hash, Rocket, Table, Target } from "lucide-react";
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
  icon: React.ElementType;
  desc: string;
  color: string;
};

const games: GameDef[] = [
  { key: "jetx", name: "JetX", icon: Rocket, desc: "Cash out before crash", color: "text-blue-400" },
  { key: "mines", name: "Mines", icon: Bomb, desc: "5×5, 3 mines", color: "text-red-400" },
  { key: "penalty", name: "Penalty", icon: Target, desc: "Beat the keeper", color: "text-green-400" },
  { key: "dice", name: "Dice", icon: Dices, desc: "Roll over/under", color: "text-white" },
  { key: "keno", name: "Keno", icon: Hash, desc: "Pick 10 numbers", color: "text-purple-400" },
  { key: "plinko", name: "Plinko", icon: Circle, desc: "Drop the ball", color: "text-yellow-400" },
  { key: "hotline", name: "Hotline", icon: Table, desc: "3-reel slot", color: "text-orange-400" },
  { key: "spin", name: "Lucky Spin", icon: Disc, desc: "Spin the wheel", color: "text-pink-400" },
  { key: "horseracing", name: "Horse Racing", icon: Flag, desc: "Pick the winner", color: "text-amber-600" },
  { key: "virtualfootball", name: "Virtual Football", icon: Goal, desc: "30-sec match", color: "text-emerald-400" },
];

const CATEGORIES = [
  { title: "Crash & Multiplier", keys: ["jetx", "mines", "penalty"] as GameKey[] },
  { title: "Dice & Numbers", keys: ["dice", "keno", "plinko"] as GameKey[] },
  { title: "Slots & Wheels", keys: ["hotline", "spin"] as GameKey[] },
  { title: "Racing & Sports", keys: ["horseracing", "virtualfootball"] as GameKey[] },
];

export default function GamesPage() {
  const [active, setActive] = useState<GameKey | null>(null);

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
        {CATEGORIES.map((cat) => (
          <div key={cat.title}>
            <h2 className="text-sm font-bold text-wb-muted uppercase tracking-wider mb-3">{cat.title}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {cat.keys.map((k) => {
                const game = games.find((g) => g.key === k)!;
                const Icon = game.icon;
                return (
                  <button
                    key={game.key}
                    onClick={() => setActive(game.key)}
                    className="group flex flex-col items-start rounded-xl border border-wb-border bg-wb-surface p-4 text-left transition hover:border-wb-primary hover:bg-wb-sub"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-wb-bg border border-wb-border-strong transition group-hover:scale-110">
                      <Icon className={`h-6 w-6 ${game.color}`} />
                    </div>
                    <span className="text-sm font-bold text-white">{game.name}</span>
                    <span className="text-xs text-wb-muted mt-0.5">{game.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}