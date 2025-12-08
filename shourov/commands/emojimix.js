module.exports.config = {
  name: "emojimix",
  version: "1.0.2",
  permssion: 0,
  credits: "Nayan (fixed by Shourov)",
  prefix: true,
  description: "Mix two emojis into one image",
  category: "image",
  usages: "[emoji1 | emoji2]",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "request": "",
    "axios": ""
  }
};

module.exports.run = async ({ api, event, args }) => {
  const fs = global.nodemodule["fs-extra"];
  const request = global.nodemodule["request"];
  const axios = global.nodemodule["axios"];

  const { threadID, messageID } = event;

  // ensure cache dir exists
  const cacheDir = __dirname + "/cache";
  try { fs.ensureDirSync(cacheDir); } catch (e) { /* ignore */ }

  // parse args: allow both "emoji1|emoji2" and "emoji1 | emoji2"
  const raw = args.join(" ");
  if (!raw || raw.indexOf("|") === -1) {
    return api.sendMessage(`Wrong format!\nUse: ${global.config.PREFIX}${this.config.name} ${this.config.usages}`, threadID, messageID);
  }

  const parts = raw.split("|").map(p => p.trim()).filter(p => p.length > 0);
  if (parts.length < 2) {
    return api.sendMessage(`Wrong format!\nUse: ${global.config.PREFIX}${this.config.name} ${this.config.usages}`, threadID, messageID);
  }

  const emoji1 = parts[0];
  const emoji2 = parts[1];

  // load API base from remote api.json (same pattern other modules used)
  let apiBase;
  try {
    const res = await axios.get("https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json", { timeout: 10000 });
    apiBase = res && res.data && res.data.api ? res.data.api : null;
  } catch (err) {
    apiBase = null;
  }

  if (!apiBase) {
    return api.sendMessage("Failed to load remote API config. Try again later.", threadID, messageID);
  }

  const outPath = cacheDir + "/emojimix.png";
  const encoded1 = encodeURIComponent(emoji1);
  const encoded2 = encodeURIComponent(emoji2);
  const url = `${apiBase}/nayan/emojimix?emoji1=${encoded1}&emoji2=${encoded2}`;

  try {
    // prefer request streaming (works in many bot setups)
    await new Promise((resolve, reject) => {
      try {
        const r = request.get(encodeURI(url)).on("error", err => reject(err));
        const ws = fs.createWriteStream(outPath);
        r.pipe(ws);
        ws.on("close", () => resolve());
        ws.on("error", err => reject(err));
      } catch (e) {
        reject(e);
      }
    });

    // send image
    await api.sendMessage({ body: `Emojimix: ${emoji1} + ${emoji2}`, attachment: fs.createReadStream(outPath) }, threadID, (err) => {
      // cleanup
      try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (e) {}
      if (err) console.error("emojimix send error:", err);
    }, messageID);

  } catch (err) {
    console.error("emojimix error:", err && (err.stack || err.message || err));
    // try fallback to axios download if request streaming failed
    try {
      const resp = await axios.get(encodeURI(url), { responseType: "arraybuffer", timeout: 20000 });
      fs.writeFileSync(outPath, Buffer.from(resp.data, "binary"));
      await api.sendMessage({ body: `Emojimix: ${emoji1} + ${emoji2}`, attachment: fs.createReadStream(outPath) }, threadID, () => {
        try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (e) {}
      }, messageID);
    } catch (err2) {
      console.error("emojimix fallback error:", err2 && (err2.stack || err2.message || err2));
      return api.sendMessage(`Can't mix ${emoji1} and ${emoji2} — try again later.`, threadID, messageID);
    }
  }
};