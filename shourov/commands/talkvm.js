module.exports.config = {
  name: "talkvm",
  version: "1.1.1",
  permission: 0,
  credits: "shourov",
  description: "talk voice message reply",
  prefix: false,
  category: "without prefix",
  cooldowns: 0
}

module.exports.run = async function({ api, event, args, Threads }) {
  const axios = require("axios");
  const { createReadStream, unlinkSync, existsSync } = global.nodemodule["fs-extra"];
  const { resolve } = global.nodemodule["path"];

  try {
    const { talk } = global.apiShourov || {}; // API base for chatbot reply
    if (!talk) return api.sendMessage("Talk API পাওয়া যাচ্ছেনা।", event.threadID, event.messageID);

    // Support: `talkvm -en hello` will force English TTS
    let ttsLang = "bn"; // default to Bangla
    let ask = args.join(" ").trim();

    if (args[0] === "-en") {
      ttsLang = "en";
      ask = args.slice(1).join(" ").trim();
    }

    // If no args but user replied to a message, use that message body
    if (!ask && event.type === "message_reply" && event.messageReply && event.messageReply.body) {
      ask = event.messageReply.body.trim();
    }

    if (!ask) return api.sendMessage('কী বলবেন তা লিখুন (বা কোনো মেসেজে reply করুন)।', event.threadID, event.messageID);

    // call talk API (ensure we encode ask)
    const talkUrl = `${talk}${encodeURIComponent(ask)}`;
    let res;
    try {
      res = await axios.get(talkUrl, { timeout: 15000 });
    } catch (err) {
      console.error("Talk API error:", err?.message || err);
      return api.sendMessage("Talk API কল ব্যর্থ হয়েছে — পরে আবার চেষ্টা করুন।", event.threadID, event.messageID);
    }

    const reply = res?.data?.reply;
    if (!reply || typeof reply !== "string") {
      console.warn("Talk API returned invalid reply:", res && res.data);
      return api.sendMessage("Talk API থেকে সঠিক উত্তর পেলাম না।", event.threadID, event.messageID);
    }

    // prepare TTS: encode reply for URL
    const safeReply = encodeURIComponent(reply);
    // choose TTS language code: 'bn' or 'en'
    // Using Google Translate TTS endpoint (client=tw-ob). Keep short replies to avoid long URLs.
    const ttsLangCode = (ttsLang === "en") ? "en" : "bn";
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${safeReply}&tl=${ttsLangCode}&client=tw-ob`;

    // path for temporary file
    const path = resolve(__dirname, 'cache', `${event.threadID}_${event.senderID}_talkvm.mp3`);

    // download file using global.utils.downloadFile if available, otherwise fallback to axios stream
    try {
      if (global && global.utils && typeof global.utils.downloadFile === "function") {
        await global.utils.downloadFile(ttsUrl, path);
      } else {
        // fallback: download with axios and write file
        const writer = require("fs").createWriteStream(path);
        const r = await axios({
          url: ttsUrl,
          method: "GET",
          responseType: "stream",
          timeout: 20000,
          headers: {
            // some endpoints require a user-agent
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
          }
        });
        await new Promise((resolveWrite, rejectWrite) => {
          r.data.pipe(writer);
          let error = null;
          writer.on('error', err => { error = err; writer.close(); rejectWrite(err); });
          writer.on('close', () => { if (!error) resolveWrite(); });
        });
      }

      // verify file exists
      if (!existsSync(path)) {
        console.error("TTS file not found after download.");
        return api.sendMessage("TTS তৈরি করতে ব্যর্থ হয়েছে।", event.threadID, event.messageID);
      }

      // send voice message
      return api.sendMessage({
        body: reply, // include text reply optionally
        attachment: createReadStream(path)
      }, event.threadID, () => {
        // cleanup
        try { unlinkSync(path); } catch (e) { /* ignore */ }
      }, event.messageID);

    } catch (err) {
      console.error("TTS download/send error:", err?.message || err);
      // cleanup on error
      try { if (existsSync(path)) unlinkSync(path); } catch(e){}
      return api.sendMessage("TTS ডাউনলোড বা পাঠানোর সময় ত্রুটি।", event.threadID, event.messageID);
    }

  } catch (error) {
    console.error("talkvm unexpected error:", error);
    return api.sendMessage('Unexpected error — পরে আবার চেষ্টা করুন।', event.threadID, event.messageID);
  }
}