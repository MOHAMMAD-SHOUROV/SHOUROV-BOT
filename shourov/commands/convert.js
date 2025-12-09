module.exports.config = {
  name: "convert",
  version: "1.1.0",
  permission: 0,
  credits: "shourov",
  prefix: true,
  description: "Download audio/video (reply or URL) and convert to MP3",
  category: "user",
  usages: "/convert <url>  OR reply to a media and send /convert",
  cooldowns: 3,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "fluent-ffmpeg": "",
    "ffmpeg-static": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const fs = global.nodemodule && global.nodemodule["fs-extra"] ? global.nodemodule["fs-extra"] : require("fs-extra");
  const axios = global.nodemodule && global.nodemodule["axios"] ? global.nodemodule["axios"] : require("axios");
  const path = require("path");

  // try to require ffmpeg libraries from global.nodemodule first
  let ffmpegPath = null;
  let ffmpeg = null;
  try {
    ffmpegPath = (global.nodemodule && global.nodemodule["ffmpeg-static"]) ? global.nodemodule["ffmpeg-static"] : require("ffmpeg-static");
    ffmpeg = (global.nodemodule && global.nodemodule["fluent-ffmpeg"]) ? global.nodemodule["fluent-ffmpeg"] : require("fluent-ffmpeg");
    if (ffmpegPath && ffmpeg && ffmpeg.setFfmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
  } catch (e) {
    // will handle below if ffmpeg missing
  }

  const threadID = event.threadID;
  const messageID = event.messageID;

  // determine source URL: either arg or reply attachment
  let srcUrl = args.join(" ").trim();
  if (!srcUrl && event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length) {
    srcUrl = event.messageReply.attachments[0].url;
  }

  if (!srcUrl) {
    return api.sendMessage("❌ কিছু দেওয়া হয়নি। ভিডিও/অডিও URL দিন অথবা একটি মিডিয়া মেসেজকে রিপ্লাই করে চালান।", threadID, messageID);
  }

  if (!/^https?:\/\//i.test(srcUrl)) {
    return api.sendMessage("❌ অগ্রহণযোগ্য URL। সঠিক http/https লিঙ্ক দিন।", threadID, messageID);
  }

  // ensure ffmpeg available
  if (!ffmpeg || !ffmpegPath) {
    return api.sendMessage("❌ সার্ভারে ffmpeg পাওয়া যায়নি। প্রথমে `ffmpeg-static` ও `fluent-ffmpeg` ইনস্টল করুন (npm i ffmpeg-static fluent-ffmpeg) বা সার্ভারে ffmpeg ইনস্টল করুন।", threadID, messageID);
  }

  // prepare paths
  const cacheDir = path.join(__dirname, "cache");
  try { await fs.ensureDir(cacheDir); } catch (e) { /* ignore */ }

  const tmpInput = path.join(cacheDir, `convert_input_${Date.now()}`);
  const outMp3 = path.join(cacheDir, `converted_${Date.now()}.mp3`);

  // download file (stream)
  let writer;
  try {
    const resp = await axios.get(srcUrl, { responseType: "stream", timeout: 60000 });
    // try to infer extension from content-type or url
    const contentType = resp.headers && resp.headers['content-type'] ? resp.headers['content-type'] : '';
    let ext = "";
    if (contentType.includes("mp4")) ext = ".mp4";
    else if (contentType.includes("mpeg")) ext = ".mp3";
    else if (contentType.includes("webm")) ext = ".webm";
    else if (contentType.includes("ogg")) ext = ".ogg";
    else {
      // try from URL
      const m = srcUrl.match(/\.(mp4|mov|m4a|mp3|webm|ogg)(\?|$)/i);
      ext = m ? (`.${m[1]}`) : ".bin";
    }
    const inputPath = tmpInput + ext;
    writer = fs.createWriteStream(inputPath);
    await new Promise((resolve, reject) => {
      resp.data.pipe(writer);
      let done = false;
      writer.on("finish", () => { done = true; resolve(); });
      writer.on("error", err => { if (!done) reject(err); });
    });

    // convert to mp3 using ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-vn',           // no video
          '-ar 44100',     // sampling rate
          '-ac 2',         // channels
          '-b:a 128k'      // audio bitrate
        ])
        .format('mp3')
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(outMp3);
    });

    // send result
    await api.sendMessage({ body: "✅ কনভার্ট শেষ — MP3 নিচে।", attachment: fs.createReadStream(outMp3) }, threadID, (err) => {
      // cleanup files after send attempt (best-effort)
      try {
        if (fs.existsSync(outMp3)) fs.unlinkSync(outMp3);
      } catch (e) {}
      try {
        if (fs.existsSync(tmpInput + ext)) fs.unlinkSync(tmpInput + ext);
      } catch (e) {}
    }, messageID);

  } catch (err) {
    console.error("convert command error:", err);
    // cleanup partial files
    try { 
      const files = await fs.readdir(path.join(__dirname, "cache"));
      for (const f of files) {
        if (f.startsWith("convert_input_") || f.startsWith("converted_")) {
          try { fs.unlinkSync(path.join(__dirname, "cache", f)); } catch (e) {}
        }
      }
    } catch (e) {}
    return api.sendMessage("❌ কোনো সমস্যা হয়েছে: " + (err.message || err), threadID, messageID);
  }
};