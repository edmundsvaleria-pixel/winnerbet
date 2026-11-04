"use client";

import Link from "next/link";
import { Search, ChevronRight, Play } from "lucide-react";
import { useState } from "react";

export default function AZMenuPage() {
  const [activeSport, setActiveSport] = useState("Football");

  const sports = ["Popular", "Football", "Basketball", "vFootball", "eFootball", "Tennis", "Table Tennis", "eBasketball", "eTennis", "Ice Hockey", "eIce Hockey", "NFL"];
  
  const leagues = [
    "My Favourites", "Today's Football", "Football in Next 3 Hours", "Champions League", 
    "Europa League", "Conference League", "England Premier League", "Spain LaLiga", 
    "Italy Serie A", "Germany Bundesliga", "France Ligue 1", "NBA", "Euroleague", "ATP/WTA", "NFL"
  ];

  return (
    <div className="min-h-screen bg-wb-bg pb-24">
      {/* Top Tabs */}
      <div className="flex border-b border-wb-border bg-wb-surface">
        <button className="flex-1 py-3 text-sm font-bold text-wb-primary border-b-2 border-wb-primary">Sports</button>
        <button className="flex-1 py-3 text-sm font-bold text-wb-muted">Live (208)</button>
        <button className="flex-1 py-3 text-sm font-bold text-wb-muted">Promotions (9)</button>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Sidebar (Sports) */}
        <div className="w-1/3 border-r border-wb-border overflow-y-auto">
          {sports.map((sport) => (
            <button 
              key={sport} 
              onClick={() => setActiveSport(sport)}
              className={`w-full text-left px-4 py-4 text-sm font-bold border-b border-wb-border/50 ${activeSport === sport ? "text-wb-primary bg-wb-primary/5" : "text-white hover:bg-wb-surface"}`}
            >
              {sport}
            </button>
          ))}
        </div>

        {/* Right Content (Leagues) */}
        <div className="w-2/3 overflow-y-auto bg-wb-bg">
          {leagues.map((league) => (
            <Link key={league} href={`/sports/football`} className="flex items-center justify-between px-4 py-4 border-b border-wb-border/50 hover:bg-wb-surface">
              <span className="text-sm font-medium text-white">{league}</span>
              <ChevronRight className="h-4 w-4 text-wb-muted" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
