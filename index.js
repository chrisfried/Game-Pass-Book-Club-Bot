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
      spreadsheetId: "1kspw-4paT-eE5-mrCrc4R9tg70lH2ZTFrJOUmOtOytg", // maintained by r/XboxGamePass
      range: "Master List!A3:J",
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const rows = res.data.values;
      if (rows.length) {
        let available = [];
        let xbox = new Set();
        let pc = new Set();
        let xCloud = new Set();
        let touchControls = new Set();
        rows.map((row) => {
          const game = row[0];
          const system = row[1];
          const cloud = row[2];
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
            oldPicks.indexOf(game) === -1
          ) {
            for (let i = 0; i < entries; i++) {
              available.push(game);
            }
            if (system === "Xbox" || system === "Xbox / PC") {
              xbox.add(game);
            }
            if (system === "PC" || system === "Xbox / PC") {
              pc.add(game);
            }
            if (cloud === "Yes") {
              xCloud.add(game);
            }
            if (cloud === "Touch Controls") {
              touchControls.add(game);
            }
          }
        });
        const pick = available[Math.floor(Math.random() * available.length)];
        const platforms = [];
        if (xbox.has(pick)) {
          platforms.push("Xbox");
        }
        if (pc.has(pick)) {
          platforms.push("PC");
        }
        if (xCloud.has(pick)) {
          platforms.push("xCloud");
        }
        if (touchControls.has(pick)) {
          platforms.push("xCloud - Touch Controls");
        }
        let payload = `<@&893208194929807370> Game of the Week\n**${pick}** (${platforms.join(
          " | "
        )})`;
        oldPicks.push(pick);

        console.log(payload);

        axios
          .post(process.env.DISCORD_WEBHOOK, {
            content: payload,
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
