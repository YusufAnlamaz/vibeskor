// check-bracket.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const apiKey = process.env.PANDASCORE_API_KEY;

// EMEA Masters'ın gerçek pandascore turnuva ID'lerinden birkaçını al
const rows = await sql`
  SELECT DISTINCT pandascore_tournament_id
  FROM matches
  WHERE tournament = 'EMEA Masters' AND pandascore_tournament_id IS NOT NULL
  LIMIT 5
`;

console.log(
  "Bulunan turnuva ID'leri:",
  rows.map((r) => r.pandascore_tournament_id),
);

for (const row of rows) {
  const id = row.pandascore_tournament_id;
  const res = await fetch(
    `https://api.pandascore.co/tournaments/${id}?token=${apiKey}`,
  );
  const data = await res.json();
  console.log(`\nTurnuva ID ${id}:`, {
    name: data.name,
    has_bracket: data.has_bracket,
    slug: data.slug,
  });
}
