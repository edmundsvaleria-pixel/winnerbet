// src/lib/odds-engine.ts

export interface MarketOdds {
  id: string;
  name: string;
  outcomes: { label: string; odds: number }[];
}

function toProb(odds: number): number {
  if (odds <= 1) return 0;
  return 1 / odds;
}

function toOdds(prob: number, margin: number = 0.06): number {
  const adjustedProb = prob * (1 + margin);
  return Math.round((1 / adjustedProb) * 100) / 100;
}

// UPDATED: Clamp odds between 1.06 and 250
export function fluctuateOdds(baseOdds: number, timeElapsedMinutes: number, virtualLiability: number = 0): number {
  if (baseOdds <= 1.01) return 0;

  const timeFactor = timeElapsedMinutes > 0 ? 1 - (timeElapsedMinutes * 0.001) : 1;
  const liabilityFactor = 1 - (virtualLiability * 0.005); 
  const adjusted = baseOdds * timeFactor * liabilityFactor;
  const jitter = 1 + (Math.random() * 0.02 - 0.01);
  
  let finalOdds = adjusted * jitter;
  
  // ENFORCE LIMITS: Highest 250, Lowest 1.06
  if (finalOdds > 250) finalOdds = 250;
  if (finalOdds < 1.06) finalOdds = 1.06;

  return Math.round(finalOdds * 100) / 100;
}

export function generateMarkets(home: number, draw: number, away: number): MarketOdds[] {
  const pH = toProb(home);
  const pD = toProb(draw);
  const pA = toProb(away);
  const totalProb = pH + pD + pA;

  const nH = pH / totalProb;
  const nD = pD / totalProb;
  const nA = pA / totalProb;

  const markets: MarketOdds[] = [];

  // 1X2
  markets.push({
    id: "1x2",
    name: "Match Result",
    outcomes: [
      { label: "Home", odds: toOdds(nH) },
      { label: "Draw", odds: toOdds(nD) },
      { label: "Away", odds: toOdds(nA) },
    ],
  });

  // Double Chance
  markets.push({
    id: "dc",
    name: "Double Chance",
    outcomes: [
      { label: "1X", odds: toOdds(nH + nD) },
      { label: "12", odds: toOdds(nH + nA) },
      { label: "X2", odds: toOdds(nD + nA) },
    ],
  });

  // Draw No Bet
  markets.push({
    id: "dnb",
    name: "Draw No Bet",
    outcomes: [
      { label: "Home", odds: toOdds(nH / (nH + nA)) },
      { label: "Away", odds: toOdds(nA / (nH + nA)) },
    ],
  });

  // BTTS
  const pBTTS = 0.52; 
  markets.push({
    id: "btts",
    name: "Both Teams To Score",
    outcomes: [
      { label: "Yes", odds: toOdds(pBTTS) },
      { label: "No", odds: toOdds(1 - pBTTS) },
    ],
  });

  // O/U Goals
  markets.push({
    id: "ou_1_5",
    name: "Over/Under 1.5 Goals",
    outcomes: [
      { label: "Over 1.5", odds: toOdds(0.75) },
      { label: "Under 1.5", odds: toOdds(0.25) },
    ],
  });

  markets.push({
    id: "ou_2_5",
    name: "Over/Under 2.5 Goals",
    outcomes: [
      { label: "Over 2.5", odds: toOdds(0.55) },
      { label: "Under 2.5", odds: toOdds(0.45) },
    ],
  });

  markets.push({
    id: "ou_3_5",
    name: "Over/Under 3.5 Goals",
    outcomes: [
      { label: "Over 3.5", odds: toOdds(0.35) },
      { label: "Under 3.5", odds: toOdds(0.65) },
    ],
  });

  // --- NEW MARKETS (Corners & Bookings) ---
  markets.push({
    id: "corners_ou",
    name: "Total Corners (Over/Under 9.5)",
    outcomes: [
      { label: "Over 9.5", odds: toOdds(0.50) },
      { label: "Under 9.5", odds: toOdds(0.50) },
    ],
  });

  markets.push({
    id: "bookings_ou",
    name: "Total Bookings (Over/Under 4.5)",
    outcomes: [
      { label: "Over 4.5", odds: toOdds(0.45) },
      { label: "Under 4.5", odds: toOdds(0.55) },
    ],
  });

  markets.push({
    id: "first_corner",
    name: "First Corner",
    outcomes: [
      { label: "Home", odds: toOdds(0.55) },
      { label: "Away", odds: toOdds(0.45) },
    ],
  });

  // Correct Score
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

  // HT/FT
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

  // Asian Handicap
  markets.push({
    id: "ah",
    name: "Asian Handicap",
    outcomes: [
      { label: "Home -1", odds: toOdds(nH * 0.7) },
      { label: "Away +1", odds: toOdds(nA * 0.8) },
    ],
  });

  // First Half Winner
  markets.push({
    id: "1h_1x2",
    name: "First Half Winner",
    outcomes: [
      { label: "Home", odds: toOdds(nH * 0.45) },
      { label: "Draw", odds: toOdds(nD * 0.70) },
      { label: "Away", odds: toOdds(nA * 0.45) },
    ],
  });

  // Total Goals
  markets.push({
    id: "total_goals",
    name: "Total Goals",
    outcomes: [
      { label: "0-1", odds: toOdds(0.30) },
      { label: "2-3", odds: toOdds(0.45) },
      { label: "4+", odds: toOdds(0.25) },
    ],
  });

  // Win to Nil
  markets.push({
    id: "win_to_nil",
    name: "Win to Nil",
    outcomes: [
      { label: "Home", odds: toOdds(nH * 0.4) },
      { label: "Away", odds: toOdds(nA * 0.4) },
    ],
  });

  // Odd/Even
  markets.push({
    id: "odd_even",
    name: "Odd/Even Goals",
    outcomes: [
      { label: "Odd", odds: toOdds(0.48) },
      { label: "Even", odds: toOdds(0.52) },
    ],
  });

  return markets;
}