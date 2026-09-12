// check-tournament-detail.mjs
const apiKey = process.env.PANDASCORE_API_KEY;

const res = await fetch(
  `https://api.pandascore.co/tournaments/21322?token=${apiKey}`,
);
const data = await res.json();
console.log(JSON.stringify(data, null, 2));
