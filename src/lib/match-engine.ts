// src/lib/match-engine.ts

export interface MatchEvent {
  minute: number;
  type: "goal" | "half_time" | "full_time";
  team: "home" | "away";
}

export function generateTimeline(result: string | null): MatchEvent[] {
  if (!result) return [];
  
  const [homeScore, awayScore] = result.split("-").map(Number);
  const events: MatchEvent[] = [];

  // Generate random minutes for Home goals (1 to 90)
  for (let i = 0; i < homeScore; i++) {
    events.push({ minute: Math.floor(Math.random() * 90) + 1, type: "goal", team: "home" });
  }

  // Generate random minutes for Away goals (1 to 90)
  for (let i = 0; i < awayScore; i++) {
    events.push({ minute: Math.floor(Math.random() * 90) + 1, type: "goal", team: "away" });
  }

  // Sort chronologically
  events.sort((a, b) => a.minute - b.minute);

  return events;
}

export function getMatchState(startTime: string, timeline: MatchEvent[], result: string | null) {
  const now = new Date().getTime();
  const start = new Date(startTime).getTime();
  const elapsedMins = (now - start) / 60000;

  let currentStatus: 'upcoming' | 'live' | 'finished' = 'upcoming';
  let isLocked = false;
  let homeScore = 0;
  let awayScore = 0;
  let currentMinute = 0;

  if (elapsedMins < 0) {
    currentStatus = 'upcoming';
  } else if (elapsedMins >= 0 && elapsedMins < 45) {
    currentStatus = 'live';
    currentMinute = Math.floor(elapsedMins);
  } else if (elapsedMins >= 45 && elapsedMins < 60) {
    currentStatus = 'live';
    isLocked = true; // Halftime
    currentMinute = 45;
  } else if (elapsedMins >= 60 && elapsedMins < 105) {
    currentStatus = 'live'; // Second half (accounting for 15m break)
    currentMinute = Math.floor(elapsedMins - 15);
  } else {
    currentStatus = 'finished';
    currentMinute = 90;
  }

  // Apply goals that have already happened based on the current minute
  timeline.forEach(event => {
    if (event.type === "goal" && currentMinute >= event.minute) {
      if (event.team === "home") homeScore++;
      if (event.team === "away") awayScore++;
    }
  });

  // If finished, guarantee the final score matches the result exactly
  if (currentStatus === 'finished' && result) {
    const [h, a] = result.split("-").map(Number);
    homeScore = h;
    awayScore = a;
  }

  return { currentStatus, isLocked, homeScore, awayScore, currentMinute };
}