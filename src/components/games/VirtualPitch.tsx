"use client";

import { motion } from "framer-motion";

export default function VirtualPitch({ homeScore, awayScore }: { homeScore: number; awayScore: number }) {
  return (
    <div className="relative w-full aspect-[2/1] rounded-xl bg-green-900 border-2 border-green-700 overflow-hidden">
      <div className="absolute inset-4 border border-white/20" />
      <div className="absolute left-1/2 top-4 bottom-4 w-px bg-white/20" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/20" />

      {Array.from({ length: 22 }).map((_, i) => {
        const isHome = i < 11;
        const x = isHome ? 20 + Math.random() * 20 : 60 + Math.random() * 20;
        const y = 20 + Math.random() * 60;
        return (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${isHome ? "bg-blue-400" : "bg-red-400"}`}
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        );
      })}

      <motion.div
        animate={{
          x: [0, 20, -10, 15, 0],
          y: [0, -15, 10, -5, 0],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-white shadow-lg"
      />

      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-4 rounded-lg bg-black/60 px-4 py-1">
        <span className="text-sm font-bold text-blue-400">Home {homeScore}</span>
        <span className="text-sm font-bold text-red-400">Away {awayScore}</span>
      </div>
    </div>
  );
}