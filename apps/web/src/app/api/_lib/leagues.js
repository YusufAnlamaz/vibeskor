// Dosya: src/app/api/_lib/leagues.js
// Frontend leagueId -> matches tablosundaki gerçek "tournament" değeri
export const LEAGUE_TOURNAMENT_MAP = {
  // League of Legends
  lec: "LEC",
  lcs: "LCS",
  lck: "LCK",
  lpl: "LPL",
  "emea-masters": "EMEA Masters",
  // CS2
  iem: "IEM",
  esea: "ESEA",
  "cct-europe": "CCT Europe",
  "european-pro-league": "European Pro League",
  united21: "United21",
  // Valorant
  vct: "VCT",
  vcl: "VCL",
  "esports-world-cup": "Esports World Cup",
  "the-pokal": "THE POKAL",
  "china-evolution-series": "China Evolution Series",
};

export function resolveTournamentName(leagueId) {
  return LEAGUE_TOURNAMENT_MAP[leagueId] || leagueId;
}
