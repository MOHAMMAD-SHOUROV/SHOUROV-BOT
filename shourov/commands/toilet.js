// commands/toilet.js
module.exports.config = {
  name: "toilet",
  version: "3.1.0",
  permission: 0,
  prefix: true,
  credits: "shourov + assistant",
  description: "Make user sit on toilet (robust avatar fetch)",
  category: "fun",
  usages: "@tag / self",
  cooldowns: 5
};

module.exports.run = async ({ event, api }) => {
  const fs = require("fs-extra");
  const path = require("path");
  const axios = require("axios");
  const Canvas = require("canvas");
  const Jimp = require("jimp");

  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  const outFile = path.join(cacheDir, `toilet_${Date.now()}.png`);

  const targetId = Object.keys(event.mentions || {})[0] || event.senderID;
  const threadID = event.threadID;

  // helper logger to console (visible in your runner)
  const log = (...a) => console.log("[toilet]", ...a);

  // try multiple methods to get avatar buffer
  async function fetchAvatarBuffer(uid) {
    // 1) Graph API with redirect=false
    try {
      log("trying graph redirect=false for", uid);
      const r = await axios.get(`https://graph.facebook.com/${uid}/picture?width=1024&height=1024&redirect=false`, { timeout: 15000 });
      if (r.data && r.data.data && r.data.data.url) {
        log("got url via graph redirect:", r.data.data.url);
        const img = await axios.get(r.data.data.url, { responseType: "arraybuffer", timeout: 15000 });
        return Buffer.from(img.data);
      }
    } catch (e) { log("graph redirect failed:", e && e.message); }

    // 2) Graph direct (may redirect)
    try {
      log("trying graph direct for", uid);
      const r2 = await axios.get(`https://graph.facebook.com/${uid}/picture?width=1024&height=1024`, { responseType: "arraybuffer", timeout: 15000 });
      if (r2 && r2.data) return Buffer.from(r2.data);
    } catch (e) { log("graph direct failed:", e && e.message); }

    // 3) Try api.getUserInfo (some libs provide it)
    try {
      log("trying api.getUserInfo for", uid);
      if (typeof api.getUserInfo === "function") {
        const info = await api.getUserInfo(uid);
        if (info && info[uid] && info[uid].profileUrl) {
          log("got profileUrl from api.getUserInfo:", info[uid].profileUrl);
          const img = await axios.get(info[uid].profileUrl, { responseType: "arraybuffer", timeout: 15000 });
          return Buffer.from(img.data);
        }
      }
    } catch (e) { log("api.getUserInfo failed:", e && e.message); }

    // 4) Try api.getThreadInfo and see participant profile pics (works in groups)
    try {
      log("trying api.getThreadInfo for", threadID);
      if (typeof api.getThreadInfo === "function") {
        const tinfo = await api.getThreadInfo(threadID);
        if (tinfo && tinfo.participantIDs && tinfo.participantIDs.includes(uid) && tinfo.userInfo) {
          // userInfo sometimes contains url
          const info = (tinfo.userInfo || []).find(u => String(u.id) == String(uid));
          if (info && info.thumbSrc) {
            log("got thumbSrc from threadInfo:", info.thumbSrc);
            const img = await axios.get(info.thumbSrc, { responseType: "arraybuffer", timeout: 15000 });
            return Buffer.from(img.data);
          }
        }
      }
    } catch (e) { log("api.getThreadInfo failed:", e && e.message); }

    // 5) If the command was used by replying to a message with an image, use that image
    try {
      if (event.type === "message_reply" && event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length) {
        const att = event.messageReply.attachments[0];
        if (att.url) {
          log("using replied-to attachment url:", att.url);
          const img = await axios.get(encodeURI(att.url), { responseType: "arraybuffer", timeout: 15000 });
          return Buffer.from(img.data);
        }
      }
    } catch (e) { log("reply attachment fetch failed:", e && e.message); }

    // 6) As final fallback, generate a placeholder avatar (initials)
    log("generating placeholder avatar for", uid);
    try {
      const canvas = Canvas.createCanvas(512, 512);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#666";
      ctx.fillRect(0, 0, 512, 512);
      // try get name for initials
      let name = "";
      try {
        if (typeof api.getUserInfo === "function") {
          const info = await api.getUserInfo(uid);
          name = info && info[uid] && (info[uid].name || "") || "";
        }
      } catch (e) {}
      const initials = (name || "U").split(" ").filter(Boolean).map(x => x[0]).slice(0,2).join("").toUpperCase();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 180px Sans";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(initials, 256, 256);
      return canvas.toBuffer();
    } catch (e) {
      log("placeholder generation failed:", e && e.message);
      // last-last fallback: small gray PNG via jimp
      const j = new Jimp(512,512, "#888");
      return await j.getBufferAsync(Jimp.MIME_PNG);
    }
  } // end fetchAvatarBuffer

  try {
    // background image
    let bgBuf;
    try {
      const bg = await axios.get("https://i.imgur.com/Kn7KpAr.jpg", { responseType: "arraybuffer", timeout: 15000 });
      bgBuf = Buffer.from(bg.data);
    } catch (e) {
      log("bg download failed, using blank bg:", e && e.message);
      const j = new Jimp(500,670, "#f4f4f4");
      bgBuf = await j.getBufferAsync(Jimp.MIME_PNG);
    }

    // get avatar
    const avatarBuf = await fetchAvatarBuffer(targetId);

    // process avatar with jimp to circle and size
    const av = await Jimp.read(avatarBuf);
    av.cover(400, 400); // ensure cover
    av.circle();
    const circ = await av.getBufferAsync(Jimp.MIME_PNG);

    // compose with canvas
    const bgImg = await Canvas.loadImage(bgBuf);
    const avImg = await Canvas.loadImage(circ);

    const canvas = Canvas.createCanvas(500, 670);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bgImg, 0, 0, 500, 670);
    // adjust avatar coordinates if needed
    ctx.drawImage(avImg, 150, 335, 200, 200);

    // optional: write name under avatar
    let displayName = "";
    try {
      if (typeof api.getUserInfo === "function") {
        const info = await api.getUserInfo(targetId);
        displayName = info && info[targetId] && (info[targetId].name || "") || "";
      }
    } catch (e) { /* ignore */ }

    if (!displayName) {
      try {
        if (event.type === "message_reply" && event.messageReply && event.messageReply.senderID) {
          // fallback
          displayName = String(event.messageReply.senderID).slice(-6);
        }
      } catch (e) {}
    }

    if (displayName) {
      ctx.fillStyle = "#000";
      ctx.font = "18px Sans";
      ctx.textAlign = "center";
      ctx.fillText(displayName, 250, 640);
    }

    // save
    await fs.writeFile(outFile, canvas.toBuffer("image/png"));

    // send
    api.sendMessage({
      body: `${displayName || "User"}, বসে গেছে 🚽`,
      attachment: fs.createReadStream(outFile)
    }, threadID, (err) => {
      if (err) console.error("[toilet] send failed:", err && err.message);
      try { fs.unlinkSync(outFile); } catch (e) {}
    });

  } catch (err) {
    console.error("[toilet] ERROR:", err && (err.stack || err.message));
    api.sendMessage("কোনো সমস্যা হয়েছে — console log দেখুন।", threadID);
  }
};