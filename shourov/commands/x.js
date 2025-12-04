module.exports.config = {
  name: "say",
  version: "1.0.3",
  permission: 0,
  credits: "shourov",
  prefix: true, // note: your message handler must allow "without prefix" if you want that behavior
  description: "text to speech (reply or provide text). use 'bn ' prefix for explicit bengali",
  category: "utility",
  usages: "[text or reply]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  // prefer global.nodemodule if present
  const fs = (global.nodemodule && global.nodemodule["fs-extra"]) ? global.nodemodule["fs-extra"] : require("fs-extra");
  const path = (global.nodemodule && global.nodemodule["path"]) ? global.nodemodule["path"] : require("path");
  const axios = (global.nodemodule && global.nodemodule["axios"]) ? global.nodemodule["axios"] : require("axios");

  try {
    // get content either from reply or args
    let content = "";
    if (event.type === "message_reply" && event.messageReply && event.messageReply.body) {
      content = String(event.messageReply.body).trim();
    } else {
      content = (args || []).join(" ").trim();
    }

    if (!content) {
      return api.sendMessage("❗ কণটেন্ট নেই — reply করো অথবা টেক্সট বার্তায় লেখো যা TTS হবে।", event.threadID);
    }

    // language detection: explicit 'bn ' prefix -> use bn, else use global.config.language or 'en'
    let lang = (global.config && global.config.language) ? String(global.config.language) : "en";
    // if user types "bn your text..." we treat as bangla
    const explicitMatch = content.match(/^(bn|en|hi|ar|fr|es)\s+/i);
    if (explicitMatch) {
      lang = explicitMatch[1].toLowerCase();
      content = content.replace(explicitMatch[0], "").trim();
    }

    // safety limits for Google TTS API (keep under ~200 chars)
    const MAX_CHARS = 200;
    if (content.length > MAX_CHARS) {
      content = content.slice(0, MAX_CHARS);
      // optional: tell user we truncated
      await api.sendMessage(`✂️ টেক্সটটা লম্বা ছিল — প্রথম ${MAX_CHARS} ক্যারেক্টার দিয়ে TTS করা হচ্ছে।`, event.threadID);
    }

    // prepare paths
    const cacheDir = path.resolve(__dirname, "cache");
    try { if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true }); } catch (e) {}
    const outFile = path.join(cacheDir, `${event.threadID}_${event.senderID}_say.mp3`);

    // Build Google translate TTS URL (client=tw-ob typical)
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(content)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;

    // download via axios with proper headers to avoid 403
    const writer = fs.createWriteStream(outFile);
    try {
      const res = await axios.get(ttsUrl, {
        responseType: "stream",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Referer": "https://translate.google.com/"
        },
        timeout: 15000
      });
      await new Promise((resolve, reject) => {
        res.data.pipe(writer);
        let error = null;
        writer.on("error", err => {
          error = err;
          writer.close();
          reject(err);
        });
        writer.on("close", () => {
          if (!error) resolve();
        });
      });
    } catch (err) {
      // cleanup if partial file
      try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch(e){}
      console.error("say: download error:", err && (err.stack || err.message || err));
      return api.sendMessage("⚠️ TTS সার্ভিসে কনট্যাক্ট করতে পারছি না। পরে চেষ্টা করো।", event.threadID);
    }

    // send audio file
    try {
      await api.sendMessage({ attachment: fs.createReadStream(outFile) }, event.threadID);
    } catch (err) {
      console.error("say: send error:", err && (err.stack || err.message || err));
      await api.sendMessage("❗ ফাইল পাঠাতে সমস্যা হয়েছে।", event.threadID);
    } finally {
      // cleanup file
      try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch (e) {}
    }

  } catch (e) {
    console.error("say command error:", e && (e.stack || e.message || e));
    try { await api.sendMessage("⚠️ Command চলাকালীন ত্রুটি হয়েছে। লগ চেক করো।", event.threadID); } catch (ignore) {}
  }
};
