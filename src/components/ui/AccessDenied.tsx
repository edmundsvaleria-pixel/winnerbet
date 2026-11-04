"use client";

import Link from "next/link";
import { Lock, CheckCircle2, XCircle } from "lucide-react";

export default function AccessDenied({ stats }: { stats: { deposits: number; bets: number } }) {
  const reqDeposits = 3;
  const reqBets = 3;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-wb-surface border border-wb-border-strong">
        <Lock className="h-10 w-10 text-wb-primary" />
      </div>
      
      <h1 className="text-2xl font-bold text-white mb-2">Casino Locked</h1>
      <p className="text-sm text-wb-muted max-w-md mb-8">
        To access the Casino and Virtual Games, you must complete the following requirements. This ensures you are an active sports bettor.
      </p>

      <div className="w-full max-w-sm space-y-3 mb-8">
        {/* Requirement 1 */}
        <div className="flex items-center justify-between rounded-xl border border-wb-border bg-wb-surface p-4">
          <div className="flex items-center gap-3">
            {stats.deposits >= reqDeposits ? <CheckCircle2 className="h-5 w-5 text-wb-primary" /> : <XCircle className="h-5 w-5 text-wb-muted" />}
            <span className="text-sm font-medium text-white">Make 3 Deposits</span>
          </div>
          <span className="text-sm font-bold text-wb-primary">{stats.deposits} / {reqDeposits}</span>
        </div>

        {/* Requirement 2 */}
        <div className="flex items-center justify-between rounded-xl border border-wb-border bg-wb-surface p-4">
          <div className="flex items-center gap-3">
            {stats.bets >= reqBets ? <CheckCircle2 className="h-5 w-5 text-wb-primary" /> : <XCircle className="h-5 w-5 text-wb-muted" />}
            <span className="text-sm font-medium text-white">Place 3 Football Bets</span>
          </div>
          <span className="text-sm font-bold text-wb-primary">{stats.bets} / {reqBets}</span>
        </div>
      </div>

      <Link href="/sports/football" className="rounded-xl bg-wb-primary px-6 py-3 text-sm font-bold text-black hover:bg-wb-primary-hover transition">
        Go to Sportsbook
      </Link>
    </div>
  );
}