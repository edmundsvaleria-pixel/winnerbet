// src/lib/odds-engine.ts

export interface MarketOdds {
  id: string;
  name: string;
  outcomes: { label: string; odds: number }[];
}

// 1. Convert Decimal Odds to Implied Probability
function toProb(odds: number): number {
  if (odds <= 1) return 0;
  return 1 / odds;
}

// 2. Convert Probability back to Decimal Odds (with margin)
function toOdds(prob: number, margin: number = 0.06): number {
  // Apply margin (e.g., 6% house edge)
  const adjustedProb = prob * (1 + margin);
  return Math.round((1 / adjustedProb) * 100) / 100;
}

// 3. The Dynamic Fluctuation Engine
// Simulates odds moving based on time decay and "virtual liability"
export function fluctuateOdds(baseOdds: number, timeElapsedMinutes: number, virtualLiability: number = 0): number {
  if (baseOdds <= 1.01) return 0;

  // A. Time Decay: As the match approaches, odds for pre-match markets compress
  // (e.g., 5 minutes before kickoff, odds drop slightly)
  const timeFactor = timeElapsedMinutes > 0 ? 1 - (timeElapsedMinutes * 0.001) : 1;

  // B. Liability: If virtualLiability is positive, it means the book is "heavy" on this outcome,
  // so we drop the odds to discourage more bets.
  const liabilityFactor = 1 - (virtualLiability * 0.005); 

  const adjusted = baseOdds * timeFactor * liabilityFactor;

  // Add slight random jitter (±1%) to make it look organic
  const jitter = 1 + (Math.random() * 0.02 - 0.01);
  
  return Math.max(1.01, Math.round(adjusted * jitter * 100) / 100);
}

// 4. THE MARKET GENERATOR
// Takes raw 1X2 odds and generates the full SportyBet market suite
export function generateMarkets(home: number, draw: number, away: number): MarketOdds[] {
  const pH = toProb(home);
  const pD = toProb(draw);
  const pA = toProb(away);
  const totalProb = pH + pD + pA;

  // Normalize probabilities (remove the bookmaker's margin first)
  const nH = pH / totalProb;
  const nD = pD / totalProb;
  const nA = pA / totalProb;

  const markets: MarketOdds[] = [];

  // Market 1: Match Result (1X2)
  markets.push({
    id: "1x2",
    name: "Match Result",
    outcomes: [
      { label: "Home", odds: toOdds(nH) },
      { label: "Draw", odds: toOdds(nD) },
      { label: "Away", odds: toOdds(nA) },
    ],
  });

  // Market 2: Double Chance
  markets.push({
    id: "dc",
    name: "Double Chance",
    outcomes: [
      { label: "1X", odds: toOdds(nH + nD) },
      { label: "12", odds: toOdds(nH + nA) },
      { label: "X2", odds: toOdds(nD + nA) },
    ],
  });

  // Market 3: Draw No Bet (DNB)
  markets.push({
    id: "dnb",
    name: "Draw No Bet",
    outcomes: [
      { label: "Home", odds: toOdds(nH / (nH + nA)) },
      { label: "Away", odds: toOdds(nA / (nH + nA)) },
    ],
  });

  // Market 4: Both Teams To Score (BTTS)
  // Simplified derived probability (typically 50-60% in football)
  const pBTTS = 0.52; 
  markets.push({
    id: "btts",
    name: "Both Teams To Score",
    outcomes: [
      { label: "Yes", odds: toOdds(pBTTS) },
      { label: "No", odds: toOdds(1 - pBTTS) },
    ],
  });

  // Market 5: Over/Under 1.5 Goals
  markets.push({
    id: "ou_1_5",
    name: "Over/Under 1.5 Goals",
    outcomes: [
      { label: "Over 1.5", odds: toOdds(0.75) },
      { label: "Under 1.5", odds: toOdds(0.25) },
    ],
  });

  // Market 6: Over/Under 2.5 Goals
  markets.push({
    id: "ou_2_5",
    name: "Over/Under 2.5 Goals",
    outcomes: [
      { label: "Over 2.5", odds: toOdds(0.55) },
      { label: "Under 2.5", odds: toOdds(0.45) },
    ],
  });

  // Market 7: Over/Under 3.5 Goals
  markets.push({
    id: "ou_3_5",
    name: "Over/Under 3.5 Goals",
    outcomes: [
      { label: "Over 3.5", odds: toOdds(0.35) },
      { label: "Under 3.5", odds: toOdds(0.65) },
    ],
  });

  // Market 8: Correct Score (Top 6 most likely)
  markets.push({
    id: "cs",
    name: "Correct Score",
    outcomes: [
      { label: "1-0", odds: toOdds(0.11) },
      { label: "2-0", odds: toOdds(0.09) },
      { label: "2-1", odds: toOdds(0.08) },
      { label: "1-1", odds: toOdds(0.12) },
      { label: "0-0", odds: toOdds(0.08) },
      { label: "0-1", odds: toOdds(0.10) },
    ],
  });

  // Market 9: Half Time / Full Time (HT/FT)
  markets.push({
    id: "ht_ft",
    name: "HT/FT",
    outcomes: [
      { label: "Home/Home", odds: toOdds(nH * 0.6) },
      { label: "Draw/Home", odds: toOdds(nH * 0.4) },
      { label: "Home/Draw", odds: toOdds(nD * 0.3) },
      { label: "Draw/Draw", odds: toOdds(nD * 0.4) },
      { label: "Away/Draw", odds: toOdds(nD * 0.3) },
      { label: "Draw/Away", odds: toOdds(nA * 0.4) },
      { label: "Away/Away", odds: toOdds(nA * 0.6) },
    ],
  });

  // Market 10: Asian Handicap (-1, +1)
  markets.push({
    id: "ah",
    name: "Asian Handicap",
    outcomes: [
      { label: "Home -1", odds: toOdds(nH * 0.7) },
      { label: "Away +1", odds: toOdds(nA * 0.8) },
    ],
  });

  // Market 11: First Half Winner
  markets.push({
    id: "1h_1x2",
    name: "First Half Winner",
    outcomes: [
      { label: "Home", odds: toOdds(nH * 0.45) },
      { label: "Draw", odds: toOdds(nD * 0.70) },
      { label: "Away", odds: toOdds(nA * 0.45) },
    ],
  });

  // Market 12: Total Goals (0-1, 2-3, 4+)
  markets.push({
    id: "total_goals",
    name: "Total Goals",
    outcomes: [
      { label: "0-1", odds: toOdds(0.30) },
      { label: "2-3", odds: toOdds(0.45) },
      { label: "4+", odds: toOdds(0.25) },
    ],
  });

  // Market 13: Win to Nil
  markets.push({
    id: "win_to_nil",
    name: "Win to Nil",
    outcomes: [
      { label: "Home", odds: toOdds(nH * 0.4) },
      { label: "Away", odds: toOdds(nA * 0.4) },
    ],
  });

  // Market 14: Odd/Even Goals
  markets.push({
    id: "odd_even",
    name: "Odd/Even Goals",
    outcomes: [
      { label: "Odd", odds: toOdds(0.48) },
      { label: "Even", odds: toOdds(0.52) },
    ],
  });

  // Market 15: Half Time Correct Score
  markets.push({
    id: "ht_cs",
    name: "Half Time Correct Score",
    outcomes: [
      { label: "0-0", odds: toOdds(0.40) },
      { label: "1-0", odds: toOdds(0.20) },
      { label: "0-1", odds: toOdds(0.15) },
      { label: "1-1", odds: toOdds(0.15) },
    ],
  });

  return markets;
}