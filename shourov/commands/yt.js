// commands/yt.js
module.exports = {
  config: {
    name: "yt",
    version: "0.0.3",
    permission: 0,
    prefix: true,
    credits: "shourov",
    description: "Download a YouTube video (uses nayan-media-downloaders if available)",
    category: "user",
    usages: "<youtube_link>",
    cooldowns: 5
  },

  start: async function({ shourov, events, args }) {
    // compat: prefer global.nodemodule if runner provides it
    const axios = (global.nodemodule && global.nodemodule["axios"]) ? global.nodemodule["axios"] : require("axios");
    const fs = (global.nodemodule && global.nodemodule["fs-extra"]) ? global.nodemodule["fs-extra"] : require("fs-extra");
    const path = (global.nodemodule && global.nodemodule["path"]) ? global.nodemodule["path"] : require("path");
    const os = require("os");

    const threadID = events.threadID || events.to || null;
    const messageID = events.messageID || null;

    try {
      if (!args || args.length === 0) {
        return shourov.sendMessage("[ ! ] Input link.", threadID, messageID);
      }

      const url = args[0].trim();
      // simple youtube-ish validation
      if (!/(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/i.test(url)) {
        return shourov.sendMessage("❗ Please provide a valid YouTube link.", threadID, messageID);
      }

      // notify user
      let loadingMsg = null;
      try {
        await new Promise(resolve => {
          shourov.sendMessage("📥 Downloading video... Please wait a little while.", threadID, (err, info) => {
            loadingMsg = info;
            resolve();
          });
        });
      } catch (e) {}

      // attempt to use nayan-media-downloaders if available
      let downloader = null;
      try {
        downloader = (global.nodemodule && global.nodemodule["nayan-media-downloaders"]) ? global.nodemodule["nayan-media-downloaders"] : require("nayan-media-downloaders");
      } catch (e) {
        downloader = null;
      }

      let result = null;

      if (downloader && typeof downloader.ytdown === "function") {
        try {
          const res = await downloader.ytdown(url);
          // standardize response shape
          // many libs return { data: { video, title, size } } or similar.
          result = res && res.data ? res.data : res;
        } catch (e) {
          console.error("yt: downloader.ytdown error:", e && (e.message || e));
          result = null;
        }
      }

      // fallback: try an online service (affiliateplus) to fetch download link / meta
      if (!result) {
        try {
          const apiResp = await axios.get(`https://api.affiliateplus.xyz/api/ytdl?url=${encodeURIComponent(url)}&format=mp4`, { timeout: 60000 }).catch(()=>null);
          if (apiResp && apiResp.data) result = apiResp.data;
        } catch (e) {
          console.error("yt: affiliateplus fallback failed:", e && (e.message || e));
        }
      }

      if (!result) {
        if (loadingMsg && loadingMsg.messageID) {
          try { await shourov.unsendMessage(loadingMsg.messageID); } catch (e) {}
        }
        return shourov.sendMessage("❌ Couldn't fetch video info. Try again later or provide a different link.", threadID, messageID);
      }

      // extract useful fields (attempt many common shapes)
      const title = result.title || result.result?.title || result.data?.title || "YouTube Video";
      const downloadUrl = result.video || result.url || result.downloadUrl || result.result?.url || result.result?.download || result.link || null;
      const thumbnail = result.thumbnail || result.thumb || result.result?.thumbnail || null;
      let filesize = result.filesize || result.size || result.result?.filesize || result.result?.size || null;

      // normalize filesize to bytes if given in human form like "12.3 MB"
      const parseSizeToBytes = (s) => {
        if (!s) return null;
        if (typeof s === "number") return s;
        const m = String(s).match(/([\d\.]+)\s*(KB|MB|GB|B)/i);
        if (m) {
          const val = parseFloat(m[1]);
          const unit = m[2].toUpperCase();
          if (unit === "B") return val;
          if (unit === "KB") return Math.round(val * 1024);
          if (unit === "MB") return Math.round(val * 1024 * 1024);
          if (unit === "GB") return Math.round(val * 1024 * 1024 * 1024);
        }
        const n = Number(String(s).replace(/\D/g, ""));
        return Number.isNaN(n) ? null : n;
      };

      const filesizeBytes = parseSizeToBytes(filesize);

      const MAX_SEND_BYTES = 25 * 1024 * 1024; // 25 MB

      if (!downloadUrl) {
        // cannot download; show info and maybe thumbnail
        if (loadingMsg && loadingMsg.messageID) {
          try { await shourov.unsendMessage(loadingMsg.messageID); } catch (e) {}
        }
        const infoMsg = `✅ Title: ${title}\n📦 Size: ${filesizeBytes ? Math.round(filesizeBytes/(1024*1024)*100)/100 + " MB" : "Unknown"}\n🔗 Link: ${result.downloadUrl || result.url || downloadUrl || "Not available"}`;
        return shourov.sendMessage(infoMsg, threadID, messageID);
      }

      // If file is known small -> download & send
      if (filesizeBytes && filesizeBytes <= MAX_SEND_BYTES) {
        const cacheDir = path.join(__dirname, "cache");
        try { if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true }); } catch (e) {}
        const tmpFile = path.join(cacheDir, `${Date.now()}_yt.mp4`);

        try {
          const dl = await axios.get(downloadUrl, { responseType: "stream", timeout: 120000 });
          await new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(tmpFile);
            dl.data.pipe(writer);
            let err = null;
            writer.on("error", e => { err = e; writer.close(); reject(e); });
            writer.on("close", () => { if (!err) resolve(); });
          });

          // send with caption
          const caption = `✅ Download ready!\n📹 ${title}\n📦 ${Math.round(filesizeBytes/(1024*1024)*100)/100} MB`;
          await shourov.sendMessage({ body: caption, attachment: fs.createReadStream(tmpFile) }, threadID, messageID);

          // cleanup
          try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (e) {}
          if (loadingMsg && loadingMsg.messageID) {
            try { await shourov.unsendMessage(loadingMsg.messageID); } catch (e) {}
          }
          return;
        } catch (e) {
          console.error("yt: download+send failed:", e && (e.stack || e));
          // fallback to send link
          if (loadingMsg && loadingMsg.messageID) {
            try { await shourov.unsendMessage(loadingMsg.messageID); } catch (er) {}
          }
          return shourov.sendMessage(`⚠️ Couldn't download the file. Use this link instead:\n${downloadUrl}`, threadID, messageID);
        }
      }

      // otherwise just share link + meta (or attempt to download if filesize unknown but download small)
      const sizeLabel = filesizeBytes ? `${Math.round(filesizeBytes/(1024*1024)*100)/100} MB` : "Unknown size";
      const outMsg = `✅ Title: ${title}\n📦 Size: ${sizeLabel}\n🔗 Download link:\n${downloadUrl}\n\nNote: If the file is < ${Math.round(MAX_SEND_BYTES/(1024*1024))}MB the bot can send it directly.`;
      if (loadingMsg && loadingMsg.messageID) {
        try { await shourov.unsendMessage(loadingMsg.messageID); } catch (e) {}
      }
      return shourov.sendMessage(outMsg, threadID, messageID);

    } catch (err) {
      console.error("yt command error:", err && (err.stack || err));
      try { shourov.sendMessage("❌ An error occurred while processing your request.", events.threadID, events.messageID); } catch (e) {}
    }
  }
};