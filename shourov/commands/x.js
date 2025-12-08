module.exports.config = {
  name: "say",
  version: "1.0.4",
  permission: 0,
  credits: "shourov (fixed)",
  prefix: true,
  description: "Text to speech — বাংলা (only bn).",
  category: "without prefix",
  usages: "[text]  অথবা reply",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const fs = global.nodemodule["fs-extra"];
  const path = global.nodemodule["path"];
  try {
    // ensure cache dir exists
    const cacheDir = path.resolve(__dirname, 'cache');
    fs.ensureDirSync(cacheDir);

    // get content: reply -> replied message body else args joined
    let content = "";
    if (event.type === "message_reply" && event.messageReply && event.messageReply.body) {
      content = String(event.messageReply.body).trim();
    } else {
      content = args.join(" ").trim();
    }

    if (!content) {
      return api.sendMessage("অনুগ্রহ করে বলতে যে টেক্সটটি TTS করতে চান তা দিন (মেসেজ রিপ্লাই করুন অথবা টেক্সট টাইপ করুন)।", event.threadID);
    }

    // Force Bengali (bn) only
    const detectedLang = "bn";

    // prepare path & download URL (Google TTS endpoint)
    const outPath = path.resolve(cacheDir, `${event.threadID}_${event.senderID}.mp3`);
    const encoded = encodeURIComponent(content);

    // Google TTS url using bn
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${detectedLang}&client=tw-ob`;

    // Attempt download using global.utils.downloadFile if available, else fallback to axios
    if (global.utils && typeof global.utils.downloadFile === "function") {
      await global.utils.downloadFile(ttsUrl, outPath);
    } else {
      const axios = (global.nodemodule && global.nodemodule["axios"]) ? global.nodemodule["axios"] : require("axios");
      const res = await axios.get(ttsUrl, {
        responseType: "arraybuffer",
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 15000
      });
      await fs.writeFile(outPath, Buffer.from(res.data));
    }

    // send result and cleanup
    try {
      const { createReadStream, unlinkSync } = global.nodemodule["fs-extra"];
      await api.sendMessage({ attachment: createReadStream(outPath) }, event.threadID, (err) => {
        try { if (fs.existsSync(outPath)) unlinkSync(outPath); } catch (e) { /* ignore */ }
      });
    } catch (e) {
      try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (err) {}
      console.error("[say] sendMessage error:", e && e.stack ? e.stack : e);
      return api.sendMessage("অডিও পাঠাতে সমস্যা হয়েছে।", event.threadID);
    }

  } catch (err) {
    console.error("[say] error:", err && (err.stack || err));
    try { return api.sendMessage("TTS তৈরি করার সময় একটি ত্রুটি ঘটেছে।", event.threadID); } catch (e) {}
  }
};