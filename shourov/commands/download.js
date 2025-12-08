module.exports = {
  config: {
    name: "download",
    version: "1.0.1",
    permission: 0,
    prefix: true,
    credits: "Nayan (fixed by shourov)",
    description: "Social Media Video Downloader",
    category: "user",
    usages: [
      "/download [Facebook video link]",
      "/download [TikTok video link]",
      "/download [YouTube video link]",
      "/download [Instagram video link]",
      "/download [Twitter video link]"
    ],
    cooldowns: 5,
    dependencies: {}
  },

  languages: {
    "en": {
      "urlinvalid": 'Unsupported video platform. Provide a valid Facebook, TikTok, Twitter, Instagram, or YouTube video link.',
      "waitfb": 'Downloading Facebook video. Please wait...',
      "downfb": "Download Facebook Video Successfully",
      "waittik": 'Downloading TikTok video. Please wait...',
      "waitinsta": 'Downloading Instagram video. Please wait...',
      "downinsta": 'Instagram video downloaded successfully',
      "waityt": 'Downloading YouTube video. Please wait...',
      "waittw": 'Downloading Twitter video. Please wait...',
      "downtw": 'Twitter video download success',
      "error": '❌ Error'
    }
  },

  start: async function ({ nayan, events, args, lang }) {
    const axios = global.nodemodule["axios"] || require("axios");
    const fs = global.nodemodule["fs-extra"] || require("fs-extra");
    const path = require("path");

    // 3rd-party helpers (these should be available in your loader env)
    let ytdown, ndown, tikdown, twitterdown;
    try {
      const dd = require("nayan-media-downloaders");
      ytdown = dd.ytdown;
      ndown = dd.ndown;
      tikdown = dd.tikdown;
      twitterdown = dd.twitterdown;
    } catch (e) {
      // If package not installed, we'll notify later when needed
      ytdown = ndown = tikdown = twitterdown = null;
    }

    const content = args.join(" ").trim();
    if (!content) return nayan.reply("Please provide a video URL.", events.threadID, events.messageID);

    // ensure cache dir
    const cacheDir = path.join(__dirname, "cache");
    try { await fs.ensureDir(cacheDir); } catch (e) { /* ignore */ }

    // helper: send a simple waiting message (returns the sent info when possible)
    async function sendWaitingMessage(bodyText) {
      try {
        const info = await nayan.reply({ body: bodyText }, events.threadID, events.messageID);
        return info;
      } catch (e) {
        // best-effort — some loaders return different shapes
        return null;
      }
    }

    // helper: write buffer to file and send then cleanup
    async function downloadAndSendFile(url, outFileName, caption) {
      try {
        const resp = await axios.get(url, { responseType: "arraybuffer", timeout: 60000 });
        const outPath = path.join(cacheDir, outFileName);
        fs.writeFileSync(outPath, Buffer.from(resp.data, "binary"));

        await nayan.reply({
          body: caption || "",
          attachment: fs.createReadStream(outPath)
        }, events.threadID, events.messageID);

        // cleanup
        try { fs.unlinkSync(outPath); } catch (e) { /* ignore */ }
      } catch (err) {
        console.error("downloadAndSendFile error:", err && (err.stack || err.message || err));
        throw err;
      }
    }

    try {
      // FACEBOOK
      if (content.includes("facebook.com") || content.includes("fb.watch")) {
        if (!ndown) return nayan.reply("Facebook downloader not available on server.", events.threadID);
        const waiting = await sendWaitingMessage(lang("waitfb"));
        const fbRes = await ndown(content);
        if (!fbRes || !fbRes.data || !fbRes.data[0] || !fbRes.data[0].url) throw new Error("No FB video URL returned");
        const videoUrl = fbRes.data[0].url;
        await downloadAndSendFile(videoUrl, `fb_${Date.now()}.mp4`, lang("downfb"));
        if (waiting && waiting.messageID) try { nayan.unsendMessage(waiting.messageID); } catch (e) {}
        return;
      }

      // TIKTOK
      if (content.includes("tiktok.com") || content.includes("vt.tiktok.com")) {
        if (!tikdown) return nayan.reply("TikTok downloader not available on server.", events.threadID);
        const waiting = await sendWaitingMessage(lang("waittik"));
        const tikRes = await tikdown(content);
        const videoUrl = (tikRes && (tikRes.data?.video || tikRes.data?.download || tikRes.data?.url)) || tikRes?.data || tikRes?.video;
        const title = tikRes?.data?.title || "";
        if (!videoUrl) throw new Error("No TikTok video URL returned");
        await downloadAndSendFile(videoUrl, `tiktok_${Date.now()}.mp4`, title ? `Title: ${title}` : "");
        if (waiting && waiting.messageID) try { nayan.unsendMessage(waiting.messageID); } catch (e) {}
        return;
      }

      // INSTAGRAM
      if (content.includes("instagram.com") || content.includes("instagr.am")) {
        if (!ndown) return nayan.reply("Instagram downloader not available on server.", events.threadID);
        const waiting = await sendWaitingMessage(lang("waitinsta"));
        const igRes = await ndown(content);
        const videoUrl = igRes && igRes.data && igRes.data[0] && igRes.data[0].url;
        if (!videoUrl) throw new Error("No Instagram video URL returned");
        await downloadAndSendFile(videoUrl, `insta_${Date.now()}.mp4`, lang("downinsta"));
        if (waiting && waiting.messageID) try { nayan.unsendMessage(waiting.messageID); } catch (e) {}
        return;
      }

      // YOUTUBE (shorts / youtu.be)
      if (content.includes("youtube.com") || content.includes("youtu.be")) {
        if (!ytdown) return nayan.reply("YouTube downloader not available on server.", events.threadID);
        const waiting = await sendWaitingMessage(lang("waityt"));
        const ytRes = await ytdown(content);
        const videoUrl = ytRes && (ytRes.data?.video || ytRes.data?.url || ytRes.video);
        const title = ytRes && (ytRes.data?.title || ytRes.title) || "";
        if (!videoUrl) throw new Error("No YouTube video URL returned");
        await downloadAndSendFile(videoUrl, `yt_${Date.now()}.mp4`, title || "");
        if (waiting && waiting.messageID) try { nayan.unsendMessage(waiting.messageID); } catch (e) {}
        return;
      }

      // TWITTER
      if (content.includes("twitter.com")) {
        if (!twitterdown) return nayan.reply("Twitter downloader not available on server.", events.threadID);
        const waiting = await sendWaitingMessage(lang("waittw"));
        const twRes = await twitterdown(content);
        // twitterdown may return multiple qualities; prefer HD then SD
        const videoUrl = (twRes && (twRes.data?.HD || twRes.data?.SD || twRes.HD || twRes.SD)) || twRes?.data || null;
        if (!videoUrl) throw new Error("No Twitter video URL returned");
        await downloadAndSendFile(videoUrl, `twitter_${Date.now()}.mp4`, lang("downtw"));
        if (waiting && waiting.messageID) try { nayan.unsendMessage(waiting.messageID); } catch (e) {}
        return;
      }

      // none matched
      return nayan.reply(lang("urlinvalid"), events.threadID, events.messageID);

    } catch (err) {
      console.error("download command error:", err && (err.stack || err.message || err));
      return nayan.reply((lang("error") || "An error occurred while downloading.") + `\n${err.message || ""}`, events.threadID, events.messageID);
    } finally {
      // final cleanup: remove old files in cache (best-effort)
      try {
        const files = await fs.readdir(cacheDir);
        for (const f of files) {
          const p = path.join(cacheDir, f);
          try { const stat = await fs.stat(p); if (stat.isFile() && Date.now() - stat.mtimeMs > 1000 * 60 * 60) { fs.unlinkSync(p); } } catch (e) {}
        }
      } catch (e) { /* ignore */ }
    }
  }
};