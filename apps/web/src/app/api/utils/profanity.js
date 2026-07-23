const badWords = [
  "küfür1",
  "küfür2",
  "toxic1",
  "toxic2",
  "aptal",
  "gerizekalı",
  "salak", // Example list, I'll add more common Turkish slurs
];

export function filterProfanity(text) {
  if (!text) return "";
  let filtered = text;
  badWords.forEach((word) => {
    const regex = new RegExp(word, "gi");
    filtered = filtered.replace(regex, "*".repeat(word.length));
  });
  return filtered;
}
