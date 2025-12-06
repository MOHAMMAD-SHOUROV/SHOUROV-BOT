module.exports.config = {
  name: "say",
  version: "1.0.3",
  permission: 0,
  credits: "shourov",
  prefix: true,
  description: "Convert text to speech (supports bn/en). Usage: say [bn|en] <text> or reply and use say",
  category: "utility",
  usages: "[tag]",
  cooldowns: 5
};

const { createReadStream, unlinkSync, existsSync, ensureDirSync } = require("fs-extra");
const { resolve } = require("path");

const MAX_CHUNK = 200; // Google TTS limit-ish (safe)

function splitText(text, n) {
  const parts = [];
  let current = "";
  const words = text.split(" ");
  for (const w of words) {
    if ((current + " " + w).trim().length > n) {
      if (current) parts.push(current.trim());
      current = w;
    } else {
      current = (current + " " + w).trim();
    }
  }
  if (current) parts.push(current.trim());
  return parts;
}

module.exports.run = async function({ api, event, args }) {
  try {
    // prepare text content
    let content = (event.type === "message_reply" && event.messageReply && event.messageReply.body) ? event.messageReply.body : args.join(" ");
    if (!content || content.trim().length === 0) return api.sendMessage("⚠️ টেক্সট দিন (example: say bn আমি তোমাকে ভালোবাসি)", event.threadID, event.messageID);

    // detect explicit language token at start: "bn " or "en "
    let languageToSay = global.config && global.config.language ? global.config.language : "en";
    const possible = content.trim().split(" ");
    if (["bn", "en"].includes(possible[0].toLowerCase())) {
      languageToSay = possible[0].toLowerCase();
      content = content.split(" ").slice(1).join(" ").trim();
    }

    if (!content || content.length === 0) return api.sendMessage("⚠️ পাঠানোর জন্য কিছু টেক্সট লাগবে।", event.threadID, event.messageID);

    // ensure cache dir exists
    const dir = resolve(__dirname, "cache", "say");
    ensureDirSync(dir);

    // split long text into safe chunks
    const chunks = splitText(content, MAX_CHUNK);

    // for each chunk, download and send
    for (let i = 0; i < chunks.length; i++) {
      const msgText = chunks[i];
      const filePath = resolve(dir, `${event.threadID}_${event.senderID}_${Date.now()}_${i}.mp3`);
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(msgText)}&tl=${languageToSay}&client=tw-ob`;
      // use global.utils.downloadFile if available, else fallback to axios
      if (global.utils && typeof global.utils.downloadFile === "function") {
        await global.utils.downloadFile(ttsUrl, filePath);
      } else {
        // fallback using axios + fs
        const axios = require("axios");
        const writer = require("fs").createWriteStream(filePath);
        const response = await axios.get(ttsUrl, { responseType: "stream", headers: { "User-Agent": "Mozilla/5.0" } });
        await new Promise((res, rej) => {
          response.data.pipe(writer);
          writer.on("finish", res);
          writer.on("error", rej);
        });
      }

      // send the chunk
      await api.sendMessage({ attachment: createReadStream(filePath) }, event.threadID);
      // cleanup
      try { unlinkSync(filePath); } catch (e) { /* ignore */ }
    }

  } catch (e) {
    console.error("say module error:", e);
    return api.sendMessage("𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓 busy naw", event.threadID, event.messageID);
  }
};
