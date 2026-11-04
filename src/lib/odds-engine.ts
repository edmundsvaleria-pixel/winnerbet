// src/lib/odds-engine.ts

export interface MarketOdds {
  id: string;
  name: string;
  group: "Main" | "Goals" | "Half" | "Bookings" | "Corners" | "Players" | "Teams" | "Minutes" | "Match";
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

export function fluctuateOdds(baseOdds: number, timeElapsedMinutes: number, virtualLiability: number = 0): number {
  if (baseOdds <= 1.01) return 0;
  const timeFactor = timeElapsedMinutes > 0 ? 1 - (timeElapsedMinutes * 0.001) : 1;
  const liabilityFactor = 1 - (virtualLiability * 0.005); 
  const adjusted = baseOdds * timeFactor * liabilityFactor;
  const jitter = 1 + (Math.random() * 0.02 - 0.01);
  let finalOdds = adjusted * jitter;
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

  // --- MAIN (15 Markets) ---
  markets.push({ id: "1x2", name: "Match Result", group: "Main", outcomes: [{ label: "Home", odds: toOdds(nH) }, { label: "Draw", odds: toOdds(nD) }, { label: "Away", odds: toOdds(nA) }] });
  markets.push({ id: "dc", name: "Double Chance", group: "Main", outcomes: [{ label: "1X", odds: toOdds(nH + nD) }, { label: "12", odds: toOdds(nH + nA) }, { label: "X2", odds: toOdds(nD + nA) }] });
  markets.push({ id: "dnb", name: "Draw No Bet", group: "Main", outcomes: [{ label: "Home", odds: toOdds(nH / (nH + nA)) }, { label: "Away", odds: toOdds(nA / (nH + nA)) }] });
  markets.push({ id: "1up", name: "1UP (Home/Away)", group: "Main", outcomes: [{ label: "Home", odds: toOdds(nH * 0.70) }, { label: "Away", odds: toOdds(nA * 0.70) }] });
  markets.push({ id: "2up", name: "2UP (Home/Away)", group: "Main", outcomes: [{ label: "Home", odds: toOdds(nH * 0.93) }, { label: "Away", odds: toOdds(nA * 0.93) }] });
  markets.push({ id: "ah_0", name: "Asian Handicap 0", group: "Main", outcomes: [{ label: "Home", odds: toOdds(nH * 0.9) }, { label: "Away", odds: toOdds(nA * 0.9) }] });
  markets.push({ id: "ah_-0_5", name: "Asian Handicap -0.5", group: "Main", outcomes: [{ label: "Home", odds: toOdds(nH * 0.8) }, { label: "Away", odds: toOdds(nA * 1.2) }] });
  markets.push({ id: "ah_+0_5", name: "Asian Handicap +0.5", group: "Main", outcomes: [{ label: "Home", odds: toOdds(nH * 1.2) }, { label: "Away", odds: toOdds(nA * 0.8) }] });
  markets.push({ id: "ah_-1", name: "Asian Handicap -1", group: "Main", outcomes: [{ label: "Home", odds: toOdds(nH * 0.7) }, { label: "Away", odds: toOdds(nA * 1.4) }] });
  markets.push({ id: "ah_+1", name: "Asian Handicap +1", group: "Main", outcomes: [{ label: "Home", odds: toOdds(nH * 1.4) }, { label: "Away", odds: toOdds(nA * 0.7) }] });
  markets.push({ id: "euro_ah_-1", name: "European Handicap -1", group: "Main", outcomes: [{ label: "Home", odds: toOdds(nH * 0.8) }, { label: "Draw", odds: toOdds(nD * 1.1) }, { label: "Away", odds: toOdds(nA * 1.6) }] });
  markets.push({ id: "euro_ah_+1", name: "European Handicap +1", group: "Main", outcomes: [{ label: "Home", odds: toOdds(nH * 1.6) }, { label: "Draw", odds: toOdds(nD * 1.1) }, { label: "Away", odds: toOdds(nA * 0.8) }] });
  markets.push({ id: "euro_ah_-2", name: "European Handicap -2", group: "Main", outcomes: [{ label: "Home", odds: toOdds(nH * 0.6) }, { label: "Draw", odds: toOdds(nD * 1.4) }, { label: "Away", odds: toOdds(nA * 2.0) }] });
  markets.push({ id: "euro_ah_+2", name: "European Handicap +2", group: "Main", outcomes: [{ label: "Home", odds: toOdds(nH * 2.0) }, { label: "Draw", odds: toOdds(nD * 1.4) }, { label: "Away", odds: toOdds(nA * 0.6) }] });
  markets.push({ id: "to_qualify", name: "To Qualify", group: "Main", outcomes: [{ label: "Home", odds: toOdds(nH * 0.9) }, { label: "Away", odds: toOdds(nA * 0.9) }] });

  // --- GOALS (20 Markets) ---
  markets.push({ id: "ou_0_5", name: "Over/Under 0.5 Goals", group: "Goals", outcomes: [{ label: "Over 0.5", odds: toOdds(0.90) }, { label: "Under 0.5", odds: toOdds(0.10) }] });
  markets.push({ id: "ou_1_5", name: "Over/Under 1.5 Goals", group: "Goals", outcomes: [{ label: "Over 1.5", odds: toOdds(0.75) }, { label: "Under 1.5", odds: toOdds(0.25) }] });
  markets.push({ id: "ou_2_5", name: "Over/Under 2.5 Goals", group: "Goals", outcomes: [{ label: "Over 2.5", odds: toOdds(0.55) }, { label: "Under 2.5", odds: toOdds(0.45) }] });
  markets.push({ id: "ou_3_5", name: "Over/Under 3.5 Goals", group: "Goals", outcomes: [{ label: "Over 3.5", odds: toOdds(0.35) }, { label: "Under 3.5", odds: toOdds(0.65) }] });
  markets.push({ id: "ou_4_5", name: "Over/Under 4.5 Goals", group: "Goals", outcomes: [{ label: "Over 4.5", odds: toOdds(0.20) }, { label: "Under 4.5", odds: toOdds(0.80) }] });
  markets.push({ id: "ou_5_5", name: "Over/Under 5.5 Goals", group: "Goals", outcomes: [{ label: "Over 5.5", odds: toOdds(0.10) }, { label: "Under 5.5", odds: toOdds(0.90) }] });
  markets.push({ id: "btts", name: "Both Teams To Score", group: "Goals", outcomes: [{ label: "Yes", odds: toOdds(0.52) }, { label: "No", odds: toOdds(0.48) }] });
  markets.push({ id: "btts_1h", name: "BTTS in 1st Half", group: "Goals", outcomes: [{ label: "Yes", odds: toOdds(0.20) }, { label: "No", odds: toOdds(0.80) }] });
  markets.push({ id: "btts_2h", name: "BTTS in 2nd Half", group: "Goals", outcomes: [{ label: "Yes", odds: toOdds(0.30) }, { label: "No", odds: toOdds(0.70) }] });
  markets.push({ id: "total_goals", name: "Total Goals", group: "Goals", outcomes: [{ label: "0-1", odds: toOdds(0.30) }, { label: "2-3", odds: toOdds(0.45) }, { label: "4+", odds: toOdds(0.25) }] });
  markets.push({ id: "exact_goals_0", name: "Exact Goals: 0", group: "Goals", outcomes: [{ label: "Yes", odds: toOdds(0.10) }, { label: "No", odds: toOdds(0.90) }] });
  markets.push({ id: "exact_goals_1", name: "Exact Goals: 1", group: "Goals", outcomes: [{ label: "Yes", odds: toOdds(0.20) }, { label: "No", odds: toOdds(0.80) }] });
  markets.push({ id: "exact_goals_2", name: "Exact Goals: 2", group: "Goals", outcomes: [{ label: "Yes", odds: toOdds(0.25) }, { label: "No", odds: toOdds(0.75) }] });
  markets.push({ id: "exact_goals_3", name: "Exact Goals: 3", group: "Goals", outcomes: [{ label: "Yes", odds: toOdds(0.20) }, { label: "No", odds: toOdds(0.80) }] });
  markets.push({ id: "exact_goals_4", name: "Exact Goals: 4", group: "Goals", outcomes: [{ label: "Yes", odds: toOdds(0.10) }, { label: "No", odds: toOdds(0.90) }] });
  markets.push({ id: "home_ou_0_5", name: "Home Team O/U 0.5", group: "Goals", outcomes: [{ label: "Over 0.5", odds: toOdds(0.70) }, { label: "Under 0.5", odds: toOdds(0.30) }] });
  markets.push({ id: "home_ou_1_5", name: "Home Team O/U 1.5", group: "Goals", outcomes: [{ label: "Over 1.5", odds: toOdds(0.40) }, { label: "Under 1.5", odds: toOdds(0.60) }] });
  markets.push({ id: "home_ou_2_5", name: "Home Team O/U 2.5", group: "Goals", outcomes: [{ label: "Over 2.5", odds: toOdds(0.20) }, { label: "Under 2.5", odds: toOdds(0.80) }] });
  markets.push({ id: "away_ou_0_5", name: "Away Team O/U 0.5", group: "Goals", outcomes: [{ label: "Over 0.5", odds: toOdds(0.60) }, { label: "Under 0.5", odds: toOdds(0.40) }] });
  markets.push({ id: "away_ou_1_5", name: "Away Team O/U 1.5", group: "Goals", outcomes: [{ label: "Over 1.5", odds: toOdds(0.30) }, { label: "Under 1.5", odds: toOdds(0.70) }] });

  // --- HALF (15 Markets) ---
  markets.push({ id: "1h_1x2", name: "First Half Winner", group: "Half", outcomes: [{ label: "Home", odds: toOdds(nH * 0.45) }, { label: "Draw", odds: toOdds(nD * 0.70) }, { label: "Away", odds: toOdds(nA * 0.45) }] });
  markets.push({ id: "2h_1x2", name: "Second Half Winner", group: "Half", outcomes: [{ label: "Home", odds: toOdds(nH * 0.55) }, { label: "Draw", odds: toOdds(nD * 0.60) }, { label: "Away", odds: toOdds(nA * 0.55) }] });
  markets.push({ id: "1h_ou_0_5", name: "1st Half O/U 0.5", group: "Half", outcomes: [{ label: "Over 0.5", odds: toOdds(0.65) }, { label: "Under 0.5", odds: toOdds(0.35) }] });
  markets.push({ id: "1h_ou_1_5", name: "1st Half O/U 1.5", group: "Half", outcomes: [{ label: "Over 1.5", odds: toOdds(0.35) }, { label: "Under 1.5", odds: toOdds(0.65) }] });
  markets.push({ id: "1h_ou_2_5", name: "1st Half O/U 2.5", group: "Half", outcomes: [{ label: "Over 2.5", odds: toOdds(0.15) }, { label: "Under 2.5", odds: toOdds(0.85) }] });
  markets.push({ id: "2h_ou_0_5", name: "2nd Half O/U 0.5", group: "Half", outcomes: [{ label: "Over 0.5", odds: toOdds(0.70) }, { label: "Under 0.5", odds: toOdds(0.30) }] });
  markets.push({ id: "2h_ou_1_5", name: "2nd Half O/U 1.5", group: "Half", outcomes: [{ label: "Over 1.5", odds: toOdds(0.45) }, { label: "Under 1.5", odds: toOdds(0.55) }] });
  markets.push({ id: "2h_ou_2_5", name: "2nd Half O/U 2.5", group: "Half", outcomes: [{ label: "Over 2.5", odds: toOdds(0.20) }, { label: "Under 2.5", odds: toOdds(0.80) }] });
  markets.push({ id: "1h_btts", name: "BTTS 1st Half", group: "Half", outcomes: [{ label: "Yes", odds: toOdds(0.20) }, { label: "No", odds: toOdds(0.80) }] });
  markets.push({ id: "1h_dc", name: "1st Half Double Chance", group: "Half", outcomes: [{ label: "1X", odds: toOdds(0.75) }, { label: "12", odds: toOdds(0.40) }, { label: "X2", odds: toOdds(0.75) }] });
  markets.push({ id: "1h_cs_00", name: "1st Half Correct Score 0-0", group: "Half", outcomes: [{ label: "Yes", odds: toOdds(0.40) }, { label: "No", odds: toOdds(0.60) }] });
  markets.push({ id: "1h_cs_10", name: "1st Half Correct Score 1-0", group: "Half", outcomes: [{ label: "Yes", odds: toOdds(0.20) }, { label: "No", odds: toOdds(0.80) }] });
  markets.push({ id: "1h_cs_01", name: "1st Half Correct Score 0-1", group: "Half", outcomes: [{ label: "Yes", odds: toOdds(0.18) }, { label: "No", odds: toOdds(0.82) }] });
  markets.push({ id: "1h_cs_11", name: "1st Half Correct Score 1-1", group: "Half", outcomes: [{ label: "Yes", odds: toOdds(0.15) }, { label: "No", odds: toOdds(0.85) }] });
  markets.push({ id: "htft", name: "HT/FT", group: "Half", outcomes: [{ label: "H/H", odds: toOdds(nH * 0.6) }, { label: "D/H", odds: toOdds(nH * 0.4) }, { label: "D/D", odds: toOdds(nD * 0.4) }, { label: "A/A", odds: toOdds(nA * 0.6) }] });

  // --- BOOKINGS (10 Markets) ---
  markets.push({ id: "bookings_ou_2_5", name: "Total Bookings O/U 2.5", group: "Bookings", outcomes: [{ label: "Over 2.5", odds: toOdds(0.70) }, { label: "Under 2.5", odds: toOdds(0.30) }] });
  markets.push({ id: "bookings_ou_3_5", name: "Total Bookings O/U 3.5", group: "Bookings", outcomes: [{ label: "Over 3.5", odds: toOdds(0.55) }, { label: "Under 3.5", odds: toOdds(0.45) }] });
  markets.push({ id: "bookings_ou_4_5", name: "Total Bookings O/U 4.5", group: "Bookings", outcomes: [{ label: "Over 4.5", odds: toOdds(0.45) }, { label: "Under 4.5", odds: toOdds(0.55) }] });
  markets.push({ id: "bookings_ou_5_5", name: "Total Bookings O/U 5.5", group: "Bookings", outcomes: [{ label: "Over 5.5", odds: toOdds(0.30) }, { label: "Under 5.5", odds: toOdds(0.70) }] });
  markets.push({ id: "home_bookings_ou_1_5", name: "Home Team Bookings O/U 1.5", group: "Bookings", outcomes: [{ label: "Over 1.5", odds: toOdds(0.40) }, { label: "Under 1.5", odds: toOdds(0.60) }] });
  markets.push({ id: "home_bookings_ou_2_5", name: "Home Team Bookings O/U 2.5", group: "Bookings", outcomes: [{ label: "Over 2.5", odds: toOdds(0.25) }, { label: "Under 2.5", odds: toOdds(0.75) }] });
  markets.push({ id: "away_bookings_ou_1_5", name: "Away Team Bookings O/U 1.5", group: "Bookings", outcomes: [{ label: "Over 1.5", odds: toOdds(0.45) }, { label: "Under 1.5", odds: toOdds(0.55) }] });
  markets.push({ id: "away_bookings_ou_2_5", name: "Away Team Bookings O/U 2.5", group: "Bookings", outcomes: [{ label: "Over 2.5", odds: toOdds(0.30) }, { label: "Under 2.5", odds: toOdds(0.70) }] });
  markets.push({ id: "most_bookings", name: "Team with Most Bookings", group: "Bookings", outcomes: [{ label: "Home", odds: toOdds(nH) }, { label: "Away", odds: toOdds(nA) }] });
  markets.push({ id: "red_card", name: "Red Card in Match", group: "Bookings", outcomes: [{ label: "Yes", odds: toOdds(0.20) }, { label: "No", odds: toOdds(0.80) }] });

  // --- CORNERS (10 Markets) ---
  markets.push({ id: "corners_ou_8_5", name: "Total Corners O/U 8.5", group: "Corners", outcomes: [{ label: "Over 8.5", odds: toOdds(0.60) }, { label: "Under 8.5", odds: toOdds(0.40) }] });
  markets.push({ id: "corners_ou_9_5", name: "Total Corners O/U 9.5", group: "Corners", outcomes: [{ label: "Over 9.5", odds: toOdds(0.50) }, { label: "Under 9.5", odds: toOdds(0.50) }] });
  markets.push({ id: "corners_ou_10_5", name: "Total Corners O/U 10.5", group: "Corners", outcomes: [{ label: "Over 10.5", odds: toOdds(0.40) }, { label: "Under 10.5", odds: toOdds(0.60) }] });
  markets.push({ id: "corners_ou_11_5", name: "Total Corners O/U 11.5", group: "Corners", outcomes: [{ label: "Over 11.5", odds: toOdds(0.30) }, { label: "Under 11.5", odds: toOdds(0.70) }] });
  markets.push({ id: "home_corners_ou_4_5", name: "Home Team Corners O/U 4.5", group: "Corners", outcomes: [{ label: "Over 4.5", odds: toOdds(0.55) }, { label: "Under 4.5", odds: toOdds(0.45) }] });
  markets.push({ id: "home_corners_ou_5_5", name: "Home Team Corners O/U 5.5", group: "Corners", outcomes: [{ label: "Over 5.5", odds: toOdds(0.40) }, { label: "Under 5.5", odds: toOdds(0.60) }] });
  markets.push({ id: "away_corners_ou_3_5", name: "Away Team Corners O/U 3.5", group: "Corners", outcomes: [{ label: "Over 3.5", odds: toOdds(0.60) }, { label: "Under 3.5", odds: toOdds(0.40) }] });
  markets.push({ id: "away_corners_ou_4_5", name: "Away Team Corners O/U 4.5", group: "Corners", outcomes: [{ label: "Over 4.5", odds: toOdds(0.45) }, { label: "Under 4.5", odds: toOdds(0.55) }] });
  markets.push({ id: "most_corners", name: "Team with Most Corners", group: "Corners", outcomes: [{ label: "Home", odds: toOdds(0.60) }, { label: "Away", odds: toOdds(0.40) }] });
  markets.push({ id: "first_corner", name: "First Corner", group: "Corners", outcomes: [{ label: "Home", odds: toOdds(0.55) }, { label: "Away", odds: toOdds(0.45) }] });

  // --- PLAYERS (10 Markets) ---
  markets.push({ id: "hat_trick", name: "Any Player Hat-Trick", group: "Players", outcomes: [{ label: "Yes", odds: toOdds(0.10) }, { label: "No", odds: toOdds(0.90) }] });
  markets.push({ id: "brace", name: "Any Player Brace", group: "Players", outcomes: [{ label: "Yes", odds: toOdds(0.25) }, { label: "No", odds: toOdds(0.75) }] });
  markets.push({ id: "first_goalscorer", name: "First Goalscorer", group: "Players", outcomes: [{ label: "Home", odds: toOdds(0.40) }, { label: "Away", odds: toOdds(0.35) }, { label: "No Goal", odds: toOdds(0.10) }] });
  markets.push({ id: "last_goalscorer", name: "Last Goalscorer", group: "Players", outcomes: [{ label: "Home", odds: toOdds(0.40) }, { label: "Away", odds: toOdds(0.35) }, { label: "No Goal", odds: toOdds(0.10) }] });
  markets.push({ id: "home_top_scorer", name: "Home Top Scorer Anytime", group: "Players", outcomes: [{ label: "Yes", odds: toOdds(0.25) }, { label: "No", odds: toOdds(0.75) }] });
  markets.push({ id: "away_top_scorer", name: "Away Top Scorer Anytime", group: "Players", outcomes: [{ label: "Yes", odds: toOdds(0.20) }, { label: "No", odds: toOdds(0.80) }] });
  markets.push({ id: "assists_1", name: "Star Player 1+ Assists", group: "Players", outcomes: [{ label: "Yes", odds: toOdds(0.15) }, { label: "No", odds: toOdds(0.85) }] });
  markets.push({ id: "assists_2", name: "Star Player 2+ Assists", group: "Players", outcomes: [{ label: "Yes", odds: toOdds(0.05) }, { label: "No", odds: toOdds(0.95) }] });
  markets.push({ id: "shots_on_target_1", name: "Star Player 1+ Shots on Target", group: "Players", outcomes: [{ label: "Yes", odds: toOdds(0.60) }, { label: "No", odds: toOdds(0.40) }] });
  markets.push({ id: "shots_on_target_2", name: "Star Player 2+ Shots on Target", group: "Players", outcomes: [{ label: "Yes", odds: toOdds(0.30) }, { label: "No", odds: toOdds(0.70) }] });

  // --- TEAMS (10 Markets) ---
  markets.push({ id: "win_to_nil", name: "Win to Nil", group: "Teams", outcomes: [{ label: "Home", odds: toOdds(nH * 0.4) }, { label: "Away", odds: toOdds(nA * 0.4) }] });
  markets.push({ id: "clean_sheet", name: "Clean Sheet", group: "Teams", outcomes: [{ label: "Home", odds: toOdds(nH * 0.5) }, { label: "Away", odds: toOdds(nA * 0.5) }] });
  markets.push({ id: "home_win_btts", name: "Home Win & BTTS", group: "Teams", outcomes: [{ label: "Yes", odds: toOdds(nH * 0.3) }, { label: "No", odds: toOdds(0.7) }] });
  markets.push({ id: "away_win_btts", name: "Away Win & BTTS", group: "Teams", outcomes: [{ label: "Yes", odds: toOdds(nA * 0.3) }, { label: "No", odds: toOdds(0.7) }] });
  markets.push({ id: "draw_btts", name: "Draw & BTTS", group: "Teams", outcomes: [{ label: "Yes", odds: toOdds(nD * 0.4) }, { label: "No", odds: toOdds(0.6) }] });
  markets.push({ id: "home_win_clean_sheet", name: "Home Win to Nil", group: "Teams", outcomes: [{ label: "Yes", odds: toOdds(nH * 0.3) }, { label: "No", odds: toOdds(0.7) }] });
  markets.push({ id: "away_win_clean_sheet", name: "Away Win to Nil", group: "Teams", outcomes: [{ label: "Yes", odds: toOdds(nA * 0.3) }, { label: "No", odds: toOdds(0.7) }] });
  markets.push({ id: "home_win_btts_no", name: "Home Win & Under 2.5", group: "Teams", outcomes: [{ label: "Yes", odds: toOdds(nH * 0.25) }, { label: "No", odds: toOdds(0.75) }] });
  markets.push({ id: "away_win_btts_no", name: "Away Win & Under 2.5", group: "Teams", outcomes: [{ label: "Yes", odds: toOdds(nA * 0.25) }, { label: "No", odds: toOdds(0.75) }] });
  markets.push({ id: "home_highest_scoring_half", name: "Home Highest Scoring Half", group: "Teams", outcomes: [{ label: "1st Half", odds: toOdds(0.4) }, { label: "2nd Half", odds: toOdds(0.5) }, { label: "Tie", odds: toOdds(0.1) }] });

  // --- MINUTES (10 Markets) ---
  markets.push({ id: "goal_1_15", name: "Goal in 1-15 Mins", group: "Minutes", outcomes: [{ label: "Yes", odds: toOdds(0.30) }, { label: "No", odds: toOdds(0.70) }] });
  markets.push({ id: "goal_16_30", name: "Goal in 16-30 Mins", group: "Minutes", outcomes: [{ label: "Yes", odds: toOdds(0.30) }, { label: "No", odds: toOdds(0.70) }] });
  markets.push({ id: "goal_31_45", name: "Goal in 31-45 Mins", group: "Minutes", outcomes: [{ label: "Yes", odds: toOdds(0.30) }, { label: "No", odds: toOdds(0.70) }] });
  markets.push({ id: "goal_46_60", name: "Goal in 46-60 Mins", group: "Minutes", outcomes: [{ label: "Yes", odds: toOdds(0.30) }, { label: "No", odds: toOdds(0.70) }] });
  markets.push({ id: "goal_61_75", name: "Goal in 61-75 Mins", group: "Minutes", outcomes: [{ label: "Yes", odds: toOdds(0.35) }, { label: "No", odds: toOdds(0.65) }] });
  markets.push({ id: "goal_76_90", name: "Goal in 76-90 Mins", group: "Minutes", outcomes: [{ label: "Yes", odds: toOdds(0.35) }, { label: "No", odds: toOdds(0.65) }] });
  markets.push({ id: "first_5min_1x2", name: "1X2 in First 5 Mins", group: "Minutes", outcomes: [{ label: "Home", odds: toOdds(0.33) }, { label: "Draw", odds: toOdds(0.34) }, { label: "Away", odds: toOdds(0.33) }] });
  markets.push({ id: "first_10min_1x2", name: "1X2 in First 10 Mins", group: "Minutes", outcomes: [{ label: "Home", odds: toOdds(nH) }, { label: "Draw", odds: toOdds(nD) }, { label: "Away", odds: toOdds(nA) }] });
  markets.push({ id: "first_15min_ou_0_5", name: "Goal in First 15 Mins", group: "Minutes", outcomes: [{ label: "Yes", odds: toOdds(0.30) }, { label: "No", odds: toOdds(0.70) }] });
  markets.push({ id: "last_15min_ou_0_5", name: "Goal in Last 15 Mins", group: "Minutes", outcomes: [{ label: "Yes", odds: toOdds(0.35) }, { label: "No", odds: toOdds(0.65) }] });

  // --- MATCH (10 Markets) ---
  markets.push({ id: "cs_1_0", name: "Correct Score 1-0", group: "Match", outcomes: [{ label: "Yes", odds: toOdds(0.11) }, { label: "No", odds: toOdds(0.89) }] });
  markets.push({ id: "cs_2_0", name: "Correct Score 2-0", group: "Match", outcomes: [{ label: "Yes", odds: toOdds(0.09) }, { label: "No", odds: toOdds(0.91) }] });
  markets.push({ id: "cs_2_1", name: "Correct Score 2-1", group: "Match", outcomes: [{ label: "Yes", odds: toOdds(0.08) }, { label: "No", odds: toOdds(0.92) }] });
  markets.push({ id: "cs_1_1", name: "Correct Score 1-1", group: "Match", outcomes: [{ label: "Yes", odds: toOdds(0.12) }, { label: "No", odds: toOdds(0.88) }] });
  markets.push({ id: "cs_0_0", name: "Correct Score 0-0", group: "Match", outcomes: [{ label: "Yes", odds: toOdds(0.08) }, { label: "No", odds: toOdds(0.92) }] });
  markets.push({ id: "cs_0_1", name: "Correct Score 0-1", group: "Match", outcomes: [{ label: "Yes", odds: toOdds(0.10) }, { label: "No", odds: toOdds(0.90) }] });
  markets.push({ id: "odd_even", name: "Odd/Even Goals", group: "Match", outcomes: [{ label: "Odd", odds: toOdds(0.48) }, { label: "Even", odds: toOdds(0.52) }] });
  markets.push({ id: "draw_no_bet_1h", name: "1st Half Draw No Bet", group: "Match", outcomes: [{ label: "Home", odds: toOdds(nH * 0.9) }, { label: "Away", odds: toOdds(nA * 0.9) }] });
  markets.push({ id: "win_from_behind", name: "Team to Win from Behind", group: "Match", outcomes: [{ label: "Home", odds: toOdds(nH * 0.4) }, { label: "Away", odds: toOdds(nA * 0.4) }] });
  markets.push({ id: "bore_draw", name: "Bore Draw (0-0)", group: "Match", outcomes: [{ label: "Yes", odds: toOdds(0.08) }, { label: "No", odds: toOdds(0.92) }] });

  return markets;
}