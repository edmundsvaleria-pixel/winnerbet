"use client";

import { motion } from "framer-motion";

export default function VirtualPitch({ homeTeam, awayTeam, isLive }: { homeTeam: string, awayTeam: string, isLive: boolean }) {
  if (!isLive) return null;

  return (
    <div className="w-full bg-wb-bg rounded-xl border border-wb-border-strong overflow-hidden mb-4 relative">
      <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] font-bold text-red-500 flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE TRACKER
      </div>
      
      {/* Pitch Background */}
      <div className="w-full aspect-[2/1] bg-green-900/40 relative">
        {/* Pitch Lines */}
        <div className="absolute inset-4 border-2 border-white/20 rounded-sm" />
        <div className="absolute top-4 bottom-4 left-1/2 w-px bg-white/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/20 rounded-full" />
        
        {/* Animated Ball */}
        <motion.div
          animate={{
            x: ["20%", "80%", "40%", "70%", "20%"],
            y: ["30%", "70%", "50%", "20%", "30%"],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10"
        />
      </div>

      {/* Live Stats Bar */}
      <div className="bg-wb-surface p-3 border-t border-wb-border flex items-center justify-between text-xs">
        <div className="text-center w-1/3">
          <p className="font-bold text-white truncate">{homeTeam}</p>
          <p className="text-wb-primary font-bold mt-1">54%</p>
        </div>
        <div className="text-center w-1/3 text-wb-muted flex flex-col gap-1">
          <div className="flex justify-between px-2"><span>Shots</span><span>8 - 5</span></div>
          <div className="flex justify-between px-2"><span>Corners</span><span>4 - 2</span></div>
        </div>
        <div className="text-center w-1/3">
          <p className="font-bold text-white truncate">{awayTeam}</p>
          <p className="text-wb-primary font-bold mt-1">46%</p>
        </div>
      </div>
    </div>
  );
}