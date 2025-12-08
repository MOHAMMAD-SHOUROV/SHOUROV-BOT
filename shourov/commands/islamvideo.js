const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "islam",
  version: "1.0.1",
  permission: 0,
  credits: "shourov",
  description: "Random Islam video",
  prefix: true,
  category: "Media",
  usages: "",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "axios": ""
  }
};

module.exports.run = async ({ api, event }) => {
  const threadID = event.threadID;
  const messageID = event.messageID;

  // List of direct-access video links (Google Drive "uc?export=download" style)
  const videos = [
    "https://drive.google.com/uc?id=1qkU11Pz0YM5YnkJUnqDj9l7o0Pk6LnO5",
    "https://drive.google.com/uc?id=1qspziP8dW7ksRvykkekZPZlFyLpGTeB5",
    "https://drive.google.com/uc?id=1Zl0IyIK_hWvtDip1UW4kHcg9EuAGQdmZ",
    "https://drive.google.com/uc?id=1qv8PRCjaTydXkILuZy5HUyI6wW4jtOW5",
    "https://drive.google.com/uc?id=1qwhnM75GeoKroHP2c1NOWcaUKlgIQUab",
    "https://drive.google.com/uc?id=1Zwg90Uest4IQViMiQB5bRYq5jJwitC6L",
    "https://drive.google.com/uc?id=1_PI6gtf-E0jrYv8n-k1s9YpsIC2AYxrk",
    "https://drive.google.com/uc?id=1qvT2dwO7dytupRRQcUdhDfHbqTFR21JI",
    "https://drive.google.com/uc?id=1ZhtkY8ZQI3cybm_GSv7aSTC--Mx3aB2p",
    "https://drive.google.com/uc?id=1qZGJGq5dOLDPDB1H8TqC0RBi4X9zCFER",
    "https://drive.google.com/uc?id=1qRWCfHjp-q2v73cqAhuKkmecrC4DWry",
    "https://drive.google.com/uc?id=1ZoHlB4898wKgfs9OEGBRdwOFVc2YhZW6",
    "https://drive.google.com/uc?id=1_KEz-3u7vP5sPFHsGNdfLsNoWP0aBatP",
    "https://drive.google.com/uc?id=1qYDNiNGDw05GMEnffAx-wzAkNvB135Xv",
    "https://drive.google.com/uc?id=1agG9tp4pV0df0yK67DeKXr4imk8Cg3DH"
  ];

  // choose random link
  const url = videos[Math.floor(Math.random() * videos.length)];
  const cacheDir = path.join(__dirname, "cache");
  const outFile = path.join(cacheDir, "islam_video.mp4");

  try {
    await fs.ensureDir(cacheDir);

    // stream download to file
    const response = await axios.get(encodeURI(url), {
      responseType: "stream",
      timeout: 20000,
      headers: {
        // some servers require a user-agent
        "User-Agent": "Mozilla/5.0 (compatible; Bot/1.0)"
      }
    });

    // pipe to disk with a Promise wrapper so we can await completion
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(outFile);
      response.data.pipe(writer);
      let finished = false;

      writer.on("finish", () => {
        finished = true;
        resolve();
      });
      writer.on("error", (err) => {
        if (!finished) reject(err);
      });

      // safety: if the stream errors, destroy it
      response.data.on("error", (err) => {
        if (!finished) reject(err);
      });
    });

    // send message with the downloaded video
    const body = "—ISLAM🥀-𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓";
    await api.sendMessage({ body, attachment: fs.createReadStream(outFile) }, threadID, () => {
      // cleanup file after sending (best-effort)
      try {
        if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
      } catch (e) {
        console.warn("cleanup error:", e && e.message);
      }
    }, messageID);

  } catch (err) {
    console.error("islam command error:", err);
    // ensure cleanup if partial file exists
    try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch (e) {}
    return api.sendMessage("Sorry, could not fetch the video. Try again later.", threadID, messageID);
  }
};