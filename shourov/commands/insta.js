module.exports = {
  config: {
    name: "insta",
    version: "0.0.3",
    permission: 0,
    prefix: true,
    credits: "shourov",
    description: "Download Instagram media (video/photo)",
    category: "user",
    usages: "<instagram_url>",
    cooldowns: 5,
  },

  languages: {
    "vi": {},
    "en": {
      "missing": "[ ! ] Input link.",
      "wait": "𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐈𝐍𝐆 𝐌𝐄𝐃𝐈𝐀 𝐅𝐎𝐑 𝐘𝐎𝐔\n\n𝐏𝐋𝐄𝐀𝐒𝐄 𝐖𝟖...",
      "down": "✅ Downloaded Successfully",
      "error": "❌ Error"
    }
  },

  start: async function({ nayan, events, args, lang }) {
    const axios = require("axios");
    const fs = require("fs-extra");
    const path = require("path");
    const { ndown } = require("nayan-media-downloaders"); // keep using this downloader

    const { messageID, threadID } = events;

    if (!args[0]) return nayan.reply(lang("missing"), threadID, messageID);

    const inputUrl = args.join(" ").trim();

    // optional "please wait" message that will be unsent after timeout or replaced
    let waitMsg;
    try {
      waitMsg = await new Promise((resolve) =>
        nayan.reply(lang("wait"), threadID, messageID, (err, info) => resolve(info))
      );

      // call downloader
      const res = await ndown(inputUrl);

      // validate response
      if (!res || !res.data || !Array.isArray(res.data) || res.data.length === 0) {
        throw new Error("No media found in downloader response");
      }

      // pick first media entry with a url
      const first = res.data.find(item => item && (item.url || item.link || item.src)) || res.data[0];
      const mediaUrl = first.url || first.link || first.src;
      if (!mediaUrl) throw new Error("Media URL missing in downloader response");

      // prepare cache path
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const outFile = path.join(cacheDir, `insta_${Date.now()}.mp4`); // assume mp4 but works for many medias

      // download via stream to avoid OOM
      const response = await axios.get(encodeURI(mediaUrl), {
        responseType: "stream",
        timeout: 30000,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Bot/1.0)" }
      });

      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(outFile);
        response.data.pipe(writer);
        let errored = false;
        writer.on("finish", resolve);
        writer.on("error", (err) => { errored = true; reject(err); });
        response.data.on("error", (err) => { if (!errored) reject(err); });
      });

      // send file
      await nayan.reply({ body: lang("down"), attachment: fs.createReadStream(outFile) }, threadID, messageID);

      // cleanup wait message if present
      try {
        if (waitMsg && waitMsg.messageID) nayan.unsendMessage(waitMsg.messageID);
      } catch (e) { /* ignore */ }

      // cleanup file after short delay (ensure upload completed)
      setTimeout(() => {
        try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch (e) {}
      }, 60000);

    } catch (err) {
      console.error("insta command error:", err && (err.stack || err));
      // remove wait message if exists
      try { if (waitMsg && waitMsg.messageID) nayan.unsendMessage(waitMsg.messageID); } catch (e) {}

      // send error reply
      try { shourov.reply(lang("error") + (err.message ? `: ${err.message}` : ""), threadID, messageID); } catch (e) {}
    }
  }
};