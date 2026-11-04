"use client";

import { useEffect, useState } from "react";
import { Match } from "@/lib/bsd";
import { Loader2, Search } from "lucide-react";
import MatchCard from "@/components/sports/MatchCard"; // Default import
import MatchDetailsModal from "@/components/sports/MatchDetailsModal"; // Default import

export default function SportPage({ params }: { params: { sport: string } }) {
  const [matches, setMatches] = useState<(Match & { isLocked?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "live">("upcoming");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  async function loadMatches() {
    try {
      const res = await fetch(`/api/live-engine`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch (err) {
      console.error("Failed to fetch matches", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMatches();
    const interval = setInterval(loadMatches, 10000); // 10 sec refresh
    return () => clearInterval(interval);
  }, []);

  const filteredMatches = matches.filter((m) => {
    if (m.status !== activeTab) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return m.homeTeam.toLowerCase().includes(q) || m.awayTeam.toLowerCase().includes(q) || m.league.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-wb-primary" /></div>;

  return (
    <div className="px-3 py-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-1 mb-3 bg-wb-surface p-1 rounded-xl border border-wb-border">
        <button onClick={() => setActiveTab("upcoming")} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${activeTab === "upcoming" ? "bg-wb-primary text-black" : "text-wb-muted"}`}>Upcoming</button>
        <button onClick={() => setActiveTab("live")} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${activeTab === "live" ? "bg-wb-primary text-black" : "text-wb-muted"}`}>Live</button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-wb-muted" />
        <input type="text" placeholder="Search team or league..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-xl border border-wb-border-strong bg-wb-surface py-3 pl-10 pr-4 text-sm text-white focus:border-wb-primary focus:outline-none" />
      </div>

      <div className="space-y-3">
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12 text-wb-muted bg-wb-surface rounded-xl border border-wb-border"><p>No matches found.</p></div>
        ) : (
          filteredMatches.map((match) => (
            <MatchCard key={match.id} match={match} onOpenDetails={setSelectedMatch} />
          ))
        )}
      </div>

      {selectedMatch && <MatchDetailsModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />}
    </div>
  );
}