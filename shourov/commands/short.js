// commands/short.js
module.exports.config = {
  name: "short",
  version: "1.0.1",
  permission: 0,
  credits: "shourov (fixed)",
  description: "Short video",
  prefix: true,
  category: "media",
  usages: "user",
  cooldowns: 5,
  dependencies: {
    "request": "",
    "fs-extra": "",
    "axios": ""
  }
};

const path = require("path");

// helper to require from global.nodemodule if loader uses that
function tryRequire(name) {
  try {
    if (global.nodemodule && global.nodemodule[name]) return global.nodemodule[name];
  } catch (e) {}
  try {
    return require(name);
  } catch (e) {
    return null;
  }
}

const fs = tryRequire("fs-extra") || tryRequire("fs") || require("fs");
const request = tryRequire("request"); // may be null if not installed
const axios = tryRequire("axios");

const CACHE_DIR = path.join(__dirname, "cache");

async function ensureCacheDir() {
  try {
    if (fs && fs.ensureDirSync) fs.ensureDirSync(CACHE_DIR);
    else if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (e) {
    console.warn("[short] ensure cache error:", e && e.message);
  }
}

module.exports.run = async ({ api, event, args }) => {
  try {
    await ensureCacheDir();

    const titles = ["Short Video _𝐒𝐡𝐨𝐮𝐫𝐨𝐯"];
    const title = titles[Math.floor(Math.random() * titles.length)];

    // list of playable direct video URLs (Google Drive "uc?export=download" style or direct)
    const links = [
      "https://drive.google.com/uc?id=17Siy3m5zeLkokRoCyWwczk6zu526JUPF&export=download",
      "https://drive.google.com/uc?id=174zQRjLL0SaJVFD5liEuKm5aR6HtSe_o&export=download",
      "https://drive.google.com/uc?id=17hYY34PphiJHdW1A_E9l_-OhDPT0eI_a&export=download",
      "https://drive.google.com/uc?id=17g-DLmU_8h0ikcPzILeckxLlc3wVTZu9&export=download",
      "https://drive.google.com/uc?id=18Bin28m7IAWa1ivis7_4AXCA_kAeoykB&export=download",
      "https://drive.google.com/uc?id=18eW1EQOhSM7fKnyY4o7M6nYW0mipCLkE&export=download",
      "https://drive.google.com/uc?id=1786skurI-bLyrKOzDil0Rhyi6jCm1W37&export=download",
      "https://drive.google.com/uc?id=19AXDVa7Ztz7VFcihLL1SUk18mvi9VZod&export=download",
      "https://drive.google.com/uc?id=17pKu6KBXey7ZUMLsEWBDOPsIy7Hi1HEQ&export=download",
      "https://drive.google.com/uc?id=192xwqhizP2L3iHCXm8K_4Jkmpd_HVG7Q&export=download",
      "https://drive.google.com/uc?id=19BzZcoVnDa-tbyFtUKjCjKQWp1ulkLJy&export=download",
      "https://drive.google.com/uc?id=19-lbnaP6WFGeIsqJqViZFuY5ESVXCF_Q&export=download",
      "https://drive.google.com/uc?id=177dfSpPPnxF3OhKfACaIBBh7WjZvaRuz&export=download",
      "https://drive.google.com/uc?id=17lpJIGRlXeXAID5VV4CC4jP_hpByMfs2&export=download",
      "https://drive.google.com/uc?id=18zNKiD8rMf_fGQpMSCA6Vs76yecmWoIN&export=download",
      "https://drive.google.com/uc?id=197tNZmre0q50GNW01DSneC3gLw6tGwF6&export=download",
      "https://drive.google.com/uc?id=17ni-ipbRL29juQxiOye2RWbITlrxaAE1&export=download",
      "https://drive.google.com/uc?id=18hqgF39ty2beCZ1CsFbsmGnUoIP-BQZU&export=download",
      "https://drive.google.com/uc?id=191ByqbJVq3EKg5Ex89iHlL0UEyuP9cEe&export=download",
      "https://drive.google.com/uc?id=18ZXuuFJkpeqW8-P5RUQgQK8g4Ers4-R7&export=download",
      "https://drive.google.com/uc?id=18E7nT22wCgLF3XWb3mpKJzkCixpJ-UB4&export=download",
      "https://drive.google.com/uc?id=18eq15C9pQ7_zgZDVCsfzfR2k-eEEAR3e&export=download",
      "https://drive.google.com/uc?id=193y_bb2bceQ1pJjbyIvVY8xJxSJ0rckc&export=download",
      "https://drive.google.com/uc?id=18xLT6ftX6U2Y7I6IDh-oG7IZyBs9oh3A&export=download",
      "https://drive.google.com/uc?id=18y5UvhotB5XoeKt5x8gE7DXsAI9BiQj3&export=download",
      "https://drive.google.com/uc?id=18wW3LDewAdJi2gDtEXQZDCKD-f6lZjJo&export=download",
      "https://drive.google.com/uc?id=193SEBLlHPDXrzdM10HZ3vptPfblD3NMw&export=download"
    ];

    // pick a link
    const link = links[Math.floor(Math.random() * links.length)];
    if (!link) return api.sendMessage("❌ No video link available.", event.threadID);

    const filename = `short_${Date.now()}.mp4`;
    const filepath = path.join(CACHE_DIR, filename);

    // download: prefer request streaming if available
    if (request) {
      await new Promise((resolve, reject) => {
        try {
          const r = request.get(link).on("error", (err) => {
            console.error("[short] request error:", err && err.message);
            reject(err);
          });
          const ws = fs.createWriteStream(filepath);
          r.pipe(ws);
          ws.on("close", () => resolve());
          ws.on("error", (err) => {
            console.error("[short] write stream error:", err && err.message);
            reject(err);
          });
        } catch (e) {
          reject(e);
        }
      });
    } else if (axios) {
      // fallback: axios download buffer
      const resp = await axios.get(link, { responseType: "arraybuffer", timeout: 30000 });
      fs.writeFileSync(filepath, Buffer.from(resp.data, "binary"));
    } else {
      return api.sendMessage("❌ Missing 'request' and 'axios' modules. Install at least one (npm i request axios).", event.threadID);
    }

    // send the file
    try {
      await api.sendMessage({ body: `「 ${title} 」`, attachment: fs.createReadStream(filepath) }, event.threadID, (err) => {
        if (err) console.error("[short] sendMessage error:", err && err.message);
        // try to delete file after send (best-effort)
        try { fs.unlinkSync(filepath); } catch (e) {}
      });
    } catch (e) {
      console.error("[short] send failed:", e && e.stack);
      try { fs.unlinkSync(filepath); } catch (err) {}
      return api.sendMessage("❌ Failed to send the video.", event.threadID);
    }

  } catch (err) {
    console.error("[short] unexpected error:", err && (err.stack || err));
    return api.sendMessage("❌ An error occurred while processing your request.", event.threadID);
  }
};