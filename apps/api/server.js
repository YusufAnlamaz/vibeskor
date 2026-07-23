const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const PANDASCORE_TOKEN = process.env.PANDASCORE_TOKEN;
const PANDASCORE_BASE_URL = "https://api.pandascore.co";

app.get("/", (req, res) => {
  res.json({
    message: "VibeSkor API çalışıyor",
  });
});

app.get("/api/matches", async (req, res) => {
  try {
    const { game } = req.query;

    const response = await axios.get(
      `${PANDASCORE_BASE_URL}/matches/upcoming`,
      {
        headers: {
          Authorization: `Bearer ${PANDASCORE_TOKEN}`,
        },
        params: {
          per_page: 20,
        },
      },
    );

    const matches = response.data.map((match) => {
      const opponentA = match.opponents?.[0]?.opponent;
      const opponentB = match.opponents?.[1]?.opponent;

      return {
        id: match.id,
        tournament: match.league?.name || match.serie?.full_name || "Turnuva",
        game: match.videogame?.slug || "unknown",
        status: match.status || "not_started",
        start_time:
          match.begin_at || match.scheduled_at || new Date().toISOString(),
        team_a_name: opponentA?.name || "Takım A",
        team_b_name: opponentB?.name || "Takım B",
        score_a: match.results?.[0]?.score || 0,
        score_b: match.results?.[1]?.score || 0,
        number_of_games: match.number_of_games || 1,
      };
    });

    const filteredMatches =
      game && game !== "hepsi"
        ? matches.filter((match) => match.game === game)
        : matches;

    res.json(filteredMatches);
  } catch (error) {
    console.error(
      "PandaScore matches error:",
      error.response?.data || error.message,
    );

    res.status(500).json({
      message: "Maçlar alınamadı",
      error: error.response?.data || error.message,
    });
  }
});
app.get("/api/teams", async (req, res) => {
  try {
    const response = await axios.get(`${PANDASCORE_BASE_URL}/teams`, {
      headers: {
        Authorization: `Bearer ${PANDASCORE_TOKEN}`,
      },
      params: {
        per_page: 20,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error(
      "PandaScore teams error:",
      error.response?.data || error.message,
    );

    res.status(500).json({
      message: "Takımlar alınamadı",
      error: error.response?.data || error.message,
    });
  }
});

app.get("/api/players", async (req, res) => {
  try {
    const response = await axios.get(`${PANDASCORE_BASE_URL}/players`, {
      headers: {
        Authorization: `Bearer ${PANDASCORE_TOKEN}`,
      },
      params: {
        per_page: 20,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error(
      "PandaScore players error:",
      error.response?.data || error.message,
    );

    res.status(500).json({
      message: "Oyuncular alınamadı",
      error: error.response?.data || error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`VibeSkor API http://localhost:${PORT} adresinde çalışıyor`);
});
