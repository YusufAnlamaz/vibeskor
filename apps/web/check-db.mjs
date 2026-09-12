// check-db.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

console.log("\n=== TABLOLAR ===");
const tables = await sql`
  SELECT table_name FROM information_schema.tables WHERE table_schema='public'
`;
console.log(tables.map((t) => t.table_name));

console.log("\n=== LIG BAŞINA TAKIM SAYISI (standings) ===");
const counts = await sql`
  SELECT league, COUNT(*) FROM standings GROUP BY league ORDER BY league
`;
console.table(counts);

console.log("\n=== STANDINGS TABLOSU ÖRNEK SATIRLAR ===");
const sample = await sql`SELECT * FROM standings LIMIT 5`;
console.table(sample);
console.log("\n=== MATCHES TABLOSU ÖRNEK SATIRLAR ===");
const matchSample = await sql`SELECT * FROM matches LIMIT 5`;
console.table(matchSample);
console.log("\n=== TOURNAMENT DEĞERLERİ (matches) ===");
const tournaments = await sql`
  SELECT tournament, game, COUNT(*), COUNT(DISTINCT team_a_name) + COUNT(DISTINCT team_b_name) as approx_teams
  FROM matches WHERE status = 'finished'
  GROUP BY tournament, game ORDER BY game, tournament
`;
console.table(tournaments);
console.log("\n=== LCS MAÇLARI DETAY ===");
const lcsMatches = await sql`
  SELECT team_a_name, team_b_name, status, winner_team, score_a, score_b, start_time
  FROM matches WHERE game = 'lol' AND tournament = 'LCS'
  ORDER BY start_time DESC
`;
console.table(lcsMatches);
console.log("\n=== THE POKAL MAÇLARI DETAY ===");
const pokalMatches = await sql`
  SELECT team_a_name, team_b_name, status, winner_team, score_a, score_b, start_time
  FROM matches WHERE game = 'valorant' AND tournament = 'THE POKAL'
  ORDER BY start_time DESC
`;
console.table(pokalMatches);
console.log("\n=== PANDASCORE_TOURNAMENT_ID DOLULUK ORANI ===");
const idStats = await sql`
  SELECT game, tournament,
    COUNT(*) AS toplam_mac,
    COUNT(pandascore_tournament_id) AS dolu_id_sayisi
  FROM matches
  GROUP BY game, tournament
  HAVING COUNT(pandascore_tournament_id) > 0
  ORDER BY dolu_id_sayisi DESC
`;
console.table(idStats);