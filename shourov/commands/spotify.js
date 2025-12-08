module.exports = {
  config: {
    name: "spotify",
    version: "0.0.4",
    permission: 0,
    prefix: true,
    credits: "shourov (improved)",
    description: "Download a Spotify search result (via API)",
    category: "admin",
    usages: "<song name>",
    cooldowns: 5,
  },

  languages: {
    "vi": {},
    "en": {
      "missing": '[ ! ] Input Song Name.',
      "searching": 'Searching for %1 ...',
      "send": 'Sending search result.',
      "error": '❌ Error',
      "tooLarge": 'The audio is too large to download (> %1 MB). Here is the link: %2',
      "noAudio": 'No audio link returned from API.'
    }
  },

  start: async function({ shourov, events, args, lang }) {
    const axios = require("axios");
    const fs = require("fs-extra");
    const path = require("path");

    const MAX_MB = 50; // max allowed file size to download (MB)
    const TEMP_DIR = path.join(__dirname, "cache");
    await fs.ensureDir(TEMP_DIR);

    try {
      if (!args || !args.length) return shourov.reply(lang("missing"), events.threadID, events.messageID);

      const text = args.join(" ").trim();
      shourov.reply(lang("searching").replace("%1", text), events.threadID, events.messageID);

      // obtain spotify helper
      let spotifyFn;
      try {
        const mod = require('nayan-api-server');
        spotifyFn = mod && mod.spotify ? mod.spotify : null;
      } catch (e) {
        spotifyFn = null;
      }

      if (typeof spotifyFn !== "function") {
        return shourov.reply(lang("error"), events.threadID, events.messageID);
      }

      const res = await spotifyFn(text).catch(() => null);
      if (!res || !res.data) {
        return shourov.reply(lang("error"), events.threadID, events.messageID);
      }

      // expected shape: res.data.audio (url) and res.data.title
      const audioUrl = res.data.audio || res.data.url || null;
      const title = res.data.title || res.data.name || text;

      if (!audioUrl) {
        return shourov.reply(lang("noAudio"), events.threadID, events.messageID);
      }

      // HEAD to check size and content-type (fast)
      let head;
      try {
        head = await axios.head(audioUrl, { timeout: 10000, headers: { "User-Agent": "Mozilla/5.0" } }).catch(() => null);
      } catch (e) {
        head = null;
      }

      const contentLength = head && head.headers && head.headers['content-length'] ? Number(head.headers['content-length']) : null;
      const sizeMB = contentLength ? (contentLength / (1024 * 1024)) : null;

      if (sizeMB && sizeMB > MAX_MB) {
        // too large to download safely — send the link instead
        return shourov.reply(lang("tooLarge").replace("%1", MAX_MB).replace("%2", audioUrl), events.threadID, events.messageID);
      }

      // prepare temp file
      const outFile = path.join(TEMP_DIR, `spotify_${events.threadID}_${Date.now()}.mp3`);
      const writer = fs.createWriteStream(outFile);

      // stream download
      const resp = await axios.get(audioUrl, {
        responseType: "stream",
        timeout: 20000,
        headers: { "User-Agent": "Mozilla/5.0" }
      }).catch(err => {
        return null;
      });

      if (!resp || !resp.data || typeof resp.data.pipe !== "function") {
        // fallback: send link if streaming unavailable
        return shourov.reply(`Unable to stream the audio. Here is the link: ${audioUrl}`, events.threadID, events.messageID);
      }

      // stream -> file with promise to await completion
      const stream = resp.data;
      const streamFinished = new Promise((resolve, reject) => {
        stream.pipe(writer);
        let errored = false;
        stream.on("error", (err) => { errored = true; writer.close(); reject(err); });
        writer.on("error", (err) => { errored = true; writer.close(); reject(err); });
        writer.on("finish", () => {
          if (!errored) resolve();
        });
      });

      // optional: abort if download grows too large while streaming (defense-in-depth)
      let downloadedBytes = 0;
      stream.on && stream.on("data", chunk => {
        downloadedBytes += chunk.length;
        if (downloadedBytes > MAX_MB * 1024 * 1024) {
          // destroy streams
          try { stream.destroy(); } catch (e) {}
          try { writer.close(); } catch (e) {}
        }
      });

      await streamFinished.catch(async (err) => {
        // remove partial file if exists
        try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch (e) {}
        throw err;
      });

      // send message
      const msgBody = `${title}\n\n⇆  ◁  ❚❚  ▷  ↻`;
      shourov.reply(lang("send"), events.threadID, events.messageID);

      // send as attachment (read stream)
      const attachment = fs.createReadStream(outFile);
      await shourov.reply({ body: msgBody, attachment: [attachment] }, events.threadID, events.messageID);

      // schedule cleanup
      setTimeout(() => {
        try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch (e) {}
      }, 60 * 1000);

    } catch (err) {
      console.error("spotify command error:", err && (err.stack || err));
      try { shourov.reply((lang && lang("error")) || "An error occurred.", events.threadID, events.messageID); } catch (e) {}
    }
  }
};