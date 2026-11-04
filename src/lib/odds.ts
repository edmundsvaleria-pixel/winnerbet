// src/lib/odds.ts

/**
 * Applies a house margin (overround) to raw odds.
 * @param rawOdds The true decimal odds from the feed.
 * @param margin The profit margin (e.g., 0.10 for 10% margin).
 */
export function applyMargin(rawOdds: number, margin: number = 0.08): number {
  if (rawOdds <= 1.01) return 0; // Ignore invalid odds
  
  // 1. Convert decimal odds to implied probability
  const impliedProb = 1 / rawOdds;
  
  // 2. Increase the probability by our margin (this lowers the odds)
  const adjustedProb = impliedProb * (1 + margin);
  
  // 3. Convert back to decimal odds and round to 2 decimals
  const newOdds = 1 / adjustedProb;
  
  return Math.round(newOdds * 100) / 100;
}
