const fs = require("fs");
const { google } = require("googleapis");
const axios = require("axios");
require("dotenv").config();

fs.readFile("previous-picks.json", (err, content) => {
  if (err) return console.log("Error loading previous picks file:", err);
  let oldPicks = JSON.parse(content);
  pickGame(oldPicks);
});

function pickGame(oldPicks) {
  const sheets = google.sheets({
    version: "v4",
    auth: process.env.GOOGLE_API_KEY,
  });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: "19RorxFhWc2lHocg4c9zrVssSwZq1u2nPcpTsAvzdJQw", // maintained by r/XboxGamePass
      range: "Master List!A3:J",
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const rows = res.data.values;
      if (rows.length) {
        let available = [];
        let ps4 = new Set();
        let ps5 = new Set();
        let essential = new Set();
        let extra = new Set();
        let premium = new Set();
        rows.map((row) => {
          const game = row[0];
          const system = row[1];
          const tier = row[2];
          const status = row[3];
          const months = row[6];
          const metacritic = row[9];
          let entries = 1;
          if (metacritic) {
            let score = parseInt(metacritic);
            if (months) {
              score -= parseInt(months);
            }
            score = Math.floor(score / 10);
            if (score > 0) {
              entries = score;
            }
          }
          if (
            (status === "Active" || status === "Leaving Soon") &&
            oldPicks.indexOf(game) === -1 && 
            (tier.indexOf("Essential") === 0 || tier.indexOf("Extra") === 0)
          ) {
            for (let i = 0; i < entries; i++) {
              available.push(game);
            }
            if (system === "PS4" || system === "PS5/PS4") {
              ps4.add(game);
            }
            if (system === "PS5" || system === "PS5/PS4") {
              ps5.add(game);
            }
            if (tier.indexOf("Essential") === 0) {
              essential.add(game)
            }  
            if (tier.indexOf("Extra") === 0) {
              extra.add(game)
            }
          }
        });
        const pick = available[Math.floor(Math.random() * available.length)];
        const platforms = [];
        if (essential.has(pick)) {
          platforms.push("Essential");
        }
        if (extra.has(pick)) {
          platforms.push("Extra");
        }
        if (ps4.has(pick)) {
          platforms.push("PS4");
        }
        if (ps5.has(pick)) {
          platforms.push("PS5");
        }
        let payload = `<@&1083592195476574248> Game of the Week\n**${pick}** (${platforms.join(
          " | "
        )})`;
        oldPicks.push(pick);

        console.log(payload);

        axios
          .post(process.env.PS_DISCORD_WEBHOOK, {
            content: payload,
            thread_name: pick
          })
          .then((res) => {
            console.log(`statusCode: ${res.status}`);
            console.log(res);
            fs.writeFile(
              "previous-picks.json",
              JSON.stringify(oldPicks),
              (err) => {}
            );
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        console.log("No data found.");
      }
    }
  );
}
