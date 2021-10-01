const fs = require("fs");
const { google } = require("googleapis");
const axios = require("axios");
require('dotenv').config();

fs.readFile("previous-picks.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  let picks = JSON.parse(content)
  // Authorize a client with credentials, then call the Google Sheets API.
  pickGame(picks)
});

function pickGame(oldPicks) {
  const sheets = google.sheets({ version: "v4", auth: process.env.GOOGLE_API_KEY });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: "1kspw-4paT-eE5-mrCrc4R9tg70lH2ZTFrJOUmOtOytg",
      range: "Master List!A3:D",
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const rows = res.data.values;
      if (rows.length) {
        let available = [];
        let xbox = [];
        let pc = [];
        let xCloud = [];
        let touchControls = []
        rows.map((row) => {
          if ((row[3] === "Active" || row[3] === "Leaving Soon") && oldPicks.indexOf(row[0]) === -1) {
            available.push(row[0]);
            if (row[1] === "Xbox" || row[1] === "Xbox / PC") {
              xbox.push(row[0]);
            }
            if (row[1] === "PC" || row[1] === "Xbox / PC") {
              pc.push(row[0]);
            }
            if (row[2] === "Yes") {
              xCloud.push(row[0]);
            }
            if (row[2] === "Touch Controls") {
              touchControls.push(row[0]);
            }
          }
        });
        const pick = available[Math.floor(Math.random() * available.length)];
        const platforms = []
        if (xbox.indexOf(pick) > -1) {
          platforms.push("Xbox")
        }
        if (pc.indexOf(pick) > -1) {
          platforms.push("PC")
        }
        if (xCloud.indexOf(pick) > -1) {
          platforms.push("xCloud")
        }
        if (touchControls.indexOf(pick) > -1) {
          platforms.push("xCloud - Touch Controls")
        }
        let payload = `<@${process.env.ROLE_ID}> Game of the Week\n**${pick}** (${platforms.join(' | ')})`
        oldPicks.push(pick);
        
        console.log(oldPicks)
        console.log(payload);
        fs.writeFile("previous-picks.json", JSON.stringify(oldPicks), (err) => {})

        // axios
        //   .post(process.env.DISCORD_WEBHOOK, {
        //     content: payload
        //   })
        //   .then((res) => {
        //     console.log(`statusCode: ${res.status}`);
        //     console.log(res);
        //     fs.writeFile("previous-picks.json", JSON.stringify(oldPicks), (err) => {})
        //   })
        //   .catch((error) => {
        //     console.error(error);
        //   });
      } else {
        console.log("No data found.");
      }
    }
  );
}
