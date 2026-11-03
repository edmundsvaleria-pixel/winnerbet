"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { Match } from "@/lib/bsd";
import { Loader2, Info } from "lucide-react";
import Link from "next/link";
import MatchCard from "@/components/sports/MatchCard";
import MatchDetailsModal from "@/components/sports/MatchDetailsModal";

export default function SportPage({
  params,
}: {
  params: { sport: string };
}) {
  const sport = params.sport;
  const loaded = useUserStore((s) => s.loaded);
  const isGuest = !loaded;

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "live">("upcoming");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    async function loadMatches() {
      setLoading(true);
      try {
        // Pass the sport parameter to the API
        const res = await fetch(`/api/sports?sport=${sport}`);
        if (res.ok) {
          const data = await res.json();
          setMatches(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, [sport]);

  const filteredMatches = matches.filter((m) => m.status === activeTab);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-wb-primary" />
      </div>
    );
  }

  return (
    <div className="px-3 py-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-24">
      {isGuest && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-wb-primary/30 bg-wb-primary/10 px-4 py-3 text-sm animate-fade-up">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-wb-primary" />
            <p className="font-medium text-white">You are browsing as a guest.</p>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-wb-primary px-4 py-1.5 text-xs font-bold text-black transition hover:bg-wb-primary-hover"
          >
            Log in to Bet
          </Link>
        </div>
      )}

      {/* SportyBet Style Tabs */}
      <div className="flex items-center gap-1 mb-4 bg-wb-surface p-1 rounded-xl border border-wb-border">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${
            activeTab === "upcoming" ? "bg-wb-primary text-black shadow-sm" : "text-wb-muted hover:text-white"
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab("live")}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${
            activeTab === "live" ? "bg-wb-primary text-black shadow-sm" : "text-wb-muted hover:text-white"
          }`}
        >
          Live
        </button>
      </div>

      {/* Match List */}
      <div className="space-y-3">
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12 text-wb-muted bg-wb-surface rounded-xl border border-wb-border">
            <p>No {activeTab} matches available right now.</p>
          </div>
        ) : (
          filteredMatches.map((match) => (
            <MatchCard 
              key={match.id} 
              match={match} 
              onOpenDetails={setSelectedMatch} 
            />
          ))
        )}
      </div>

      {/* SportScore Attribution Link (Required for Free Tier) */}
      {(sport === "basketball" || sport === "tennis") && (
        <div className="mt-12 text-center pb-8">
          <p className="text-sm text-wb-muted">
            Data provided by{" "}
            <a 
              href="https://sportscore.com/" 
              rel="dofollow" 
              target="_blank"
              className="font-bold text-wb-primary hover:underline"
            >
              SportScore
            </a>
          </p>
        </div>
      )}

      {/* Match Center Modal */}
      {selectedMatch && (
        <MatchDetailsModal 
          match={selectedMatch} 
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}