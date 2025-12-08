// scan.js
module.exports.config = {
  name: "scan",
  version: "1.0.1",
  permission: 0,
  credits: "shourov",
  description: "Scan QR code from a replied image and return the decoded text",
  prefix: true,
  category: "user",
  usages: "reply qrcode",
  cooldowns: 5,
  dependencies: {
    "jimp": "",
    "qrcode-reader": "",
    "image-downloader": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const fs = require("fs");
  const path = require("path");
  const jimp = require("jimp");
  const QrCode = require("qrcode-reader");
  const imageDownloader = require("image-downloader");

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const tempPath = path.join(cacheDir, `qrcode_${event.threadID}_${event.messageID}.png`);
  try {
    const { threadID, messageID, type } = event;
    const messageReply = event.messageReply; // loader-friendly

    // Validate reply
    if (type !== "message_reply" || !messageReply) {
      return api.sendMessage("[⚜️]➜ Please reply to an image containing a QR code.", threadID, messageID);
    }

    if (!messageReply.attachments || messageReply.attachments.length === 0) {
      return api.sendMessage("[⚜️]➜ Replied message must contain an attachment (photo).", threadID, messageID);
    }

    if (messageReply.attachments.length > 1) {
      return api.sendMessage("[⚜️]➜ Please reply to only one image.", threadID, messageID);
    }

    const attachment = messageReply.attachments[0];
    if (attachment.type !== "photo" && attachment.type !== "image") {
      return api.sendMessage("[⚜️]➜ The attachment is not an image. Reply to a photo that contains a QR code.", threadID, messageID);
    }

    // Download image
    await imageDownloader.image({ url: attachment.url, dest: tempPath });

    // Read with jimp
    const img = await jimp.read(fs.readFileSync(tempPath));
    const qr = new QrCode();

    const value = await new Promise((resolve, reject) => {
      qr.callback = (err, v) => {
        if (err) return reject(err);
        resolve(v);
      };
      qr.decode(img.bitmap);
    });

    const resultText = value && value.result ? String(value.result) : null;
    if (!resultText) {
      return api.sendMessage("[❌]➜ Could not decode any QR code from the image. Try a clearer image.", threadID, messageID);
    }

    return api.sendMessage(`[✅]➜ Result: ${resultText}`, threadID, messageID);
  } catch (err) {
    console.error("QR Scan error:", err);
    return api.sendMessage("[❌]➜ Error occurred while scanning QR code. Please try again later.", event.threadID, event.messageID);
  } finally {
    // cleanup
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch (e) { /* ignore cleanup errors */ }
  }
};