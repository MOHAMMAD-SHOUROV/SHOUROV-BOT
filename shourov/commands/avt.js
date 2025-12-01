// commands/avt.js
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "avt",
  version: "1.0.1",
  permission: 0,
  credits: "shourov (fixed)",
  description: "Get avatar pictures (group, uid, profile link, user, mentions)",
  prefix: true,
  category: "user",
  usages: "avt box|id|link|user ...",
  cooldowns: 5
};

module.exports.name = module.exports.config.name;

const CACHE_DIR = path.join(__dirname, "cache");
fs.ensureDirSync(CACHE_DIR);

async function downloadToFile(url, outPath) {
  const resp = await axios.get(url, { responseType: "arraybuffer", timeout: 20000 });
  await fs.writeFile(outPath, Buffer.from(resp.data));
}

module.exports.run = async function({ api, event, args, Threads, Users }) {
  try {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const threadSetting = (await Threads.getData(String(threadID))).data || {};
    const prefix = threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : global.config.PREFIX;
    const cmdName = this.config.name;

    if (!args[0]) {
      const help = `[🔰] FB-AVATAR [🔰]

Usage:
→ ${prefix}${cmdName} box [threadID?]    : Get group avatar (current or provided thread id)
→ ${prefix}${cmdName} id <UID>          : Get avatar by Facebook UID
→ ${prefix}${cmdName} link <profileURL> : Get avatar by profile link
→ ${prefix}${cmdName} user [@mention]   : Get avatar of user (self if blank)
`;
      return api.sendMessage(help, threadID, messageID);
    }

    const sub = args[0].toLowerCase();

    // helper to send file and cleanup
    const sendAndCleanup = async (filePath, body = "") => {
      try {
        await api.sendMessage({ body, attachment: fs.createReadStream(filePath) }, threadID, () => {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }, messageID);
      } catch (e) {
        try { fs.unlinkSync(filePath); } catch (er) {}
        throw e;
      }
    };

    // Get thread (group) avatar
    if (sub === "box") {
      let targetThreadID = args[1] || threadID;
      const threadInfo = await api.getThreadInfo(targetThreadID);
      const img = threadInfo && threadInfo.imageSrc;
      if (!img) return api.sendMessage(`[🔰] → No avatar set for box "${threadInfo ? threadInfo.threadName : targetThreadID}".`, threadID, messageID);

      const out = path.join(CACHE_DIR, `avt_box_${Date.now()}.jpg`);
      await downloadToFile(img, out);
      return sendAndCleanup(out, `[🔰] → Avatar of box: ${threadInfo.threadName || targetThreadID}`);
    }

    // Get by UID
    if (sub === "id") {
      const uid = args[1];
      if (!uid) return api.sendMessage("[🔰] → Please provide a UID. Usage: avt id <UID>", threadID, messageID);
      const url = `https://graph.facebook.com/${uid}/picture?height=720&width=720`;
      const out = path.join(CACHE_DIR, `avt_id_${uid}_${Date.now()}.jpg`);
      try {
        await downloadToFile(url, out);
        return sendAndCleanup(out);
      } catch (e) {
        return api.sendMessage("[🔰] → Can't get user picture. UID may be invalid or blocked.", threadID, messageID);
      }
    }

    // Get by profile link (try to resolve UID using fb-tools if available; fallback: try link directly)
    if (sub === "link") {
      const link = args[1] || (event.messageReply && event.messageReply.body);
      if (!link) return api.sendMessage("[🔰] → Please provide a profile link. Usage: avt link <URL>", threadID, messageID);

      let uid = null;
      try {
        const fbTools = require("fb-tools");
        uid = await fbTools.findUid(link);
      } catch (e) {
        // ignore if fb-tools not available or fails; try extract from link if possible
        const m = link.match(/(?:profile\.php\?id=|\/([0-9]{5,}))(?:[\/?]|$)/i);
        if (m) uid = m[1] || null;
      }

      if (!uid) {
        // try sending the link directly as image (some profile URLs may redirect to image)
        try {
          const outDirect = path.join(CACHE_DIR, `avt_link_direct_${Date.now()}.jpg`);
          await downloadToFile(link, outDirect);
          return sendAndCleanup(outDirect);
        } catch (err) {
          return api.sendMessage("[🔰] → Could not resolve UID from link and direct fetch failed.", threadID, messageID);
        }
      }

      const url = `https://graph.facebook.com/${uid}/picture?height=720&width=720`;
      const out = path.join(CACHE_DIR, `avt_link_${uid}_${Date.now()}.jpg`);
      try {
        await downloadToFile(url, out);
        return sendAndCleanup(out);
      } catch (e) {
        return api.sendMessage("[🔰] → Failed to fetch avatar from resolved UID.", threadID, messageID);
      }
    }

    // Get user avatar (self or mention)
    if (sub === "user") {
      // mention handling
      const mentions = event.mentions && Object.keys(event.mentions);
      let uid = null;

      if (mentions && mentions.length > 0) {
        uid = mentions[0]; // first mention
      } else if (args[1] && args[1].match(/^[0-9]+$/)) {
        uid = args[1];
      } else {
        uid = event.senderID;
      }

      const url = `https://graph.facebook.com/${uid}/picture?height=720&width=720`;
      const out = path.join(CACHE_DIR, `avt_user_${uid}_${Date.now()}.jpg`);
      try {
        await downloadToFile(url, out);
        return sendAndCleanup(out);
      } catch (e) {
        return api.sendMessage("[🔰] → Can't get user picture.", threadID, messageID);
      }
    }

    // fallback
    return api.sendMessage(`[🔰] → Wrong usage. Use ${prefix}${cmdName} to view the available commands.`, threadID, messageID);

  } catch (err) {
    console.error("avt command error:", err && (err.stack || err));
    try { return api.sendMessage("[🔰] → An unexpected error occurred while processing your request.", event.threadID, event.messageID); } catch(e) {}
  }
};
