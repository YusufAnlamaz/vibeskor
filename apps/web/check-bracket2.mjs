// check-bracket2.mjs
const apiKey = process.env.PANDASCORE_API_KEY;

const res = await fetch(
  `https://api.pandascore.co/tournaments/21209/brackets?token=${apiKey}`,
);
const data = await res.json();
console.log(JSON.stringify(data, null, 2));
