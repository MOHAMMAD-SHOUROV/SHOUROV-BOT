module.exports = {
  config: {
    name: "spotify",
    version: "0.0.3",
    permission: 0,
    prefix: true,
    credits: "shourov",
    description: "",
    category: "admin",
    usages: "",
    cooldowns: 5,
  },

  languages: {
    "vi": {},
    "en": {
      "missing": '[ ! ] Input Song Name.',
      "searching": 'Searching for %1 ...',
      "send": 'Sending search result.',
      "error": '❌ Error'
    }
  },

  start: async function({ shourov, events, args, lang }) {
    try {
      if (!args[0]) return nayan.reply(lang("missing"), events.threadID, events.messageID);
      const axios = require("axios");
      const fs = require("fs-extra");
      const path = require("path");
      const { spotify } = require('nayan-api-server');

      const text = args.join(" ").trim();
      // inform user
      shourov.reply(lang("searching").replace("%1", text), events.threadID, events.messageID);

      // call spotify API (assume spotify is a function returning result)
      const res = await spotify(text);
      if (!res || !res.data) {
        return shourov.reply(lang("error"), events.threadID, events.messageID);
      }

      // assume res.data has fields: audio (url) and title (string)
      const { audio: audioUrl, title } = res.data;

      if (!audioUrl) {
        return shourov.reply("No audio link returned from API.", events.threadID, events.messageID);
      }

      // ensure cache dir exists
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      const outFile = path.join(cacheDir, `spotify_${events.threadID}_${Date.now()}.mp3`);

      // download audio as arraybuffer and write as binary
      const audioResp = await axios.get(audioUrl, { responseType: "arraybuffer", timeout: 20000, headers: { "User-Agent": "Mozilla/5.0" } });
      const audioData = audioResp.data;
      // write binary
      await fs.writeFile(outFile, Buffer.from(audioData));

      // prepare message body
      const msgBody = `${title || "Unknown title"}\n\n⇆  ◁  ❚❚  ▷  ↻`;

      // send a short "sending" notice (optional)
      shourov.reply(lang("send"), events.threadID, events.messageID);

      // send the audio file
      const attachment = fs.createReadStream(outFile);
      await shourov.reply({ body: msgBody, attachment: [attachment] }, events.threadID, events.messageID);

      // cleanup: remove file after a small delay (to allow upload to complete)
      setTimeout(() => {
        try { fs.unlinkSync(outFile); } catch (e) { /* ignore */ }
      }, 60000);

    } catch (err) {
      console.error("spotify command error:", err);
      try {
        // best-effort reply with error
        shourov.reply((lang && lang("error")) || "An error occurred.", events.threadID, events.messageID);
      } catch (e) { /* ignore */ }
    }
  }
};