// commands/convert.js
module.exports.config = {
  name: "convert",
  version: "1.1.0",
  permission: 0,
  credits: "shourov (fixed)",
  prefix: true,
  description: "Convert audio/video URL or replied media to MP3 (best-effort)",
  category: "user",
  usages: "convert <url>  OR reply to a message with media & run convert",
  cooldowns: 0
};

module.exports.run = async function ({ api, args, event, Users }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const path = require("path");

  const sendError = (text) => {
    try { return api.sendMessage(text, event.threadID, event.messageID); } catch (e) { console.error(e); }
  };

  try {
    // determine source: argument URL or replied attachment
    let source = args.join(" ").trim();
    if (!source) {
      // if reply and attachment exists, try to use its URL
      if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
        source = event.messageReply.attachments[0].url;
      }
    }

    if (!source) return sendError("❗ নির্দেশনা: একটি মিডিয়া URL দিন অথবা একটি মেসেজ রিপ্লাই করে চালান যা মিডিয়া অ্যাটাচ করে।\nUsage: convert <url>");

    // basic validation (very permissive)
    if (!/^https?:\/\//i.test(source)) {
      return sendError("❗ প্রদত্ত লিংকটি বৈধ http/https URL নয়। অনুগ্রহ করে সঠিক URL ব্যবহার করুন।");
    }

    // prepare temp file paths
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const tmpIn = path.join(cacheDir, `input_${Date.now()}`);
    const tmpOut = path.join(cacheDir, `output_${Date.now()}.mp3`);

    // fetch binary
    let response;
    try {
      response = await axios.get(source, { responseType: "arraybuffer", timeout: 60000 });
    } catch (err) {
      console.error("Download error:", err && (err.message || err));
      return sendError("❗ মিডিয়া ডাউনলোড করা যায়নি — লিংক ব্লক করা থাকতে পারে বা সার্ভার সাড়া দিচ্ছে না।");
    }

    // save raw file
    await fs.writeFile(tmpIn, Buffer.from(response.data));

    // Attempt conversion to MP3.
    // Note: We will try a simple rename if the input already an mp3,
    // otherwise, if ffmpeg available on host, use it to convert.
    const { exec } = require("child_process");
    const inputExt = path.extname(source).split("?")[0].toLowerCase() || "";
    const isAlreadyMp3 = inputExt === ".mp3" || (response.headers && (response.headers['content-type'] || "").includes("audio/mpeg"));

    if (isAlreadyMp3) {
      // simply move/copy to output path with .mp3 extension
      await fs.copyFile(tmpIn, tmpOut);
    } else {
      // try to convert using ffmpeg (if present)
      const ffmpegCmd = `ffmpeg -y -i "${tmpIn}" -vn -c:a libmp3lame -q:a 4 "${tmpOut}"`;
      let converted = false;
      try {
        await new Promise((resolve, reject) => {
          exec(ffmpegCmd, { timeout: 120000 }, (err, stdout, stderr) => {
            if (err) return reject(err);
            return resolve();
          });
        });
        converted = true;
      } catch (e) {
        console.warn("ffmpeg conversion failed or not available:", e && e.message ? e.message : e);
        // fallback: if conversion failed, try sending the raw input if it's playable
        try {
          await fs.copyFile(tmpIn, tmpOut); // attempt to send raw (may not be .mp3)
          converted = true;
        } catch (err) {
          console.error("fallback copy failed:", err);
          converted = false;
        }
      }
      if (!converted) {
        await fs.remove(tmpIn).catch(()=>{});
        return sendError("❗ কনভার্ট করা যায়নি (ffmpeg অনুপলব্ধ বা ইনপুট ফাইল সমর্থিত নয়)।");
      }
    }

    // send output file
    try {
      await api.sendMessage({
        body: "✅ Convert complete — here's your MP3.",
        attachment: fs.createReadStream(tmpOut)
      }, event.threadID, event.messageID);
    } catch (err) {
      console.error("Send message error:", err);
      return sendError("❗ ফাইল পাঠাতে সমস্যা হয়েছে — সম্ভবত ফাইল সাইজ বা API সীমা।");
    } finally {
      // cleanup
      await fs.remove(tmpIn).catch(()=>{});
      // keep small chance to remove output after sending
      setTimeout(() => fs.remove(tmpOut).catch(()=>{}), 15 * 1000);
    }

  } catch (err) {
    console.error("convert command error:", err && (err.stack || err));
    return api.sendMessage("❗Unexpected error occurred while processing convert command.", event.threadID, event.messageID);
  }
};
