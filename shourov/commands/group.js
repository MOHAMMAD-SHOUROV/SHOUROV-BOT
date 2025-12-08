// commands/group.js
module.exports.config = {
  name: "group",
  version: "1.0.1",
  permission: 0,
  credits: "nayan (adapted by shourov)",
  description: "change group name / emoji / image / manage admin / info",
  prefix: false,
  category: "box",
  usages: "name/emoji/admin/image/info",
  cooldowns: 5
};

function tryRequire(name) {
  try { if (global.nodemodule && global.nodemodule[name]) return global.nodemodule[name]; } catch (e) {}
  try { return require(name); } catch (e) { return null; }
}

const fs = tryRequire("fs-extra") || tryRequire("fs") || require("fs");
const request = tryRequire("request") || tryRequire("request"); // may be null
const path = require("path");

module.exports.run = async ({ api, event, args, global }) => {
  try {
    const { threadID, messageID, senderID } = event;
    if (!args || args.length === 0) {
      const help = `Use one of the following:\n\n/group name <new name>\n/group emoji <emoji or reply with emoji>\n/group image (reply to an image to set)\n/group admin <@user|reply> (toggle admin)\n/group info (show group info)\n\nExamples:\n/group name My New Group\n/group emoji 😂\n/group admin @John`;
      return api.sendMessage(help, threadID, messageID);
    }

    const sub = args[0].toLowerCase();

    // helper to get target user id from mention or reply
    const getTargetFromEvent = () => {
      if (event.type === "message_reply" && event.messageReply && event.messageReply.senderID) return event.messageReply.senderID;
      if (event.mentions && Object.keys(event.mentions).length > 0) return Object.keys(event.mentions)[0];
      return null;
    };

    // 1) change name
    if (sub === "name") {
      // take the rest as name; if user replied and no args after name, use reply body
      let newName = args.slice(1).join(" ").trim();
      if (!newName && event.type === "message_reply" && event.messageReply && event.messageReply.body) {
        newName = event.messageReply.body.slice(0, 100); // limit length
      }
      if (!newName) return api.sendMessage("প্যারামিটার মিসিং: /group name <নতুন নাম>", threadID, messageID);
      await api.setTitle(newName, threadID);
      return api.sendMessage(`✅ Group name changed to: ${newName}`, threadID, messageID);
    }

    // 2) change emoji
    if (sub === "emoji" || sub === "em") {
      let emoji = args.slice(1).join(" ").trim();
      if (!emoji && event.type === "message_reply" && event.messageReply && event.messageReply.body) emoji = event.messageReply.body.trim().split(/\s+/)[0];
      if (!emoji) return api.sendMessage("Provide an emoji. Example: /group emoji 😂", threadID, messageID);
      try {
        await api.changeThreadEmoji(emoji, threadID);
        return api.sendMessage(`✅ Emoji changed to ${emoji}`, threadID, messageID);
      } catch (e) {
        return api.sendMessage("Failed to change emoji. Ensure the character is a valid emoji.", threadID, messageID);
      }
    }

    // 3) promote/demote admin (toggle)
    if (sub === "admin") {
      // only allow if sender is admin of group
      const threadInfo = await api.getThreadInfo(threadID);
      const senderIsAdmin = threadInfo && Array.isArray(threadInfo.adminIDs) && threadInfo.adminIDs.some(i => String(i.id) === String(senderID));
      if (!senderIsAdmin) return api.sendMessage("❌ আপনার কাছে এই কাজটি করার অনুমতি নেই (আপনি অ্যাডমিন নন)।", threadID, messageID);

      // determine target
      let target = getTargetFromEvent();
      if (!target) {
        // if second arg numeric maybe id
        if (args[1] && /^\d+$/.test(args[1])) target = args[1];
        else return api.sendMessage("উদ্দেশ্য নির্ধারণ করুন — ট্যাগ করুন বা উত্তর দিন: /group admin @user", threadID, messageID);
      }

      // check current admin status
      const isAdmin = threadInfo.adminIDs.some(x => String(x.id) === String(target));
      try {
        await api.changeAdminStatus(threadID, target, !isAdmin);
        return api.sendMessage(`${!isAdmin ? "✅ Promoted to admin." : "✅ Demoted from admin."}`, threadID, messageID);
      } catch (err) {
        console.error("changeAdminStatus error:", err);
        return api.sendMessage("Failed to change admin status. Bot must be group admin and have permission.", threadID, messageID);
      }
    }

    // 4) set image (reply to image)
    if (sub === "image") {
      if (event.type !== "message_reply" || !event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
        return api.sendMessage("❌ একটি ইমেজ/ভিডিও যুক্ত মেসেজে রেপ্লাই করুন।", threadID, messageID);
      }
      const attach = event.messageReply.attachments[0];
      if (!attach.url) return api.sendMessage("❌ তার মেসেজে কোন বৈধ মিডিয়া লিংক নেই।", threadID, messageID);
      // make cache dir
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      const outPath = path.join(cacheDir, `group_${threadID}_img.png`);

      if (!request) {
        // fallback to axios download
        const axios = tryRequire("axios") || require("axios");
        try {
          const resp = await axios.get(attach.url, { responseType: "arraybuffer", timeout: 20000 });
          fs.writeFileSync(outPath, Buffer.from(resp.data, "binary"));
        } catch (e) {
          console.error("download fail axios:", e);
          return api.sendMessage("Failed to download image.", threadID, messageID);
        }
      } else {
        // use request to pipe
        await new Promise((resolve, reject) => {
          try {
            request(encodeURI(attach.url)).pipe(fs.createWriteStream(outPath)).on("close", resolve).on("error", reject);
          } catch (e) { reject(e); }
        }).catch(err => {
          console.error("download fail request:", err);
        });
        if (!fs.existsSync(outPath)) return api.sendMessage("Failed to download image.", threadID, messageID);
      }

      // change image
      try {
        await api.changeGroupImage(fs.createReadStream(outPath), threadID, () => {
          // cleanup
          try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (e) {}
        });
        return api.sendMessage("✅ Group image updated.", threadID, messageID);
      } catch (err) {
        console.error("changeGroupImage error:", err);
        try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (e) {}
        return api.sendMessage("Failed to change group image. Bot must be admin.", threadID, messageID);
      }
    }

    // 5) info
    if (sub === "info") {
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        const threadMem = threadInfo.participantIDs ? threadInfo.participantIDs.length : 0;
        let male = 0, female = 0, unknown = 0;
        if (Array.isArray(threadInfo.userInfo)) {
          for (const u of threadInfo.userInfo) {
            if (!u || !u.gender) { unknown++; continue; }
            if (u.gender === "MALE") male++;
            else if (u.gender === "FEMALE") female++;
            else unknown++;
          }
        }
        const adminList = Array.isArray(threadInfo.adminIDs) ? threadInfo.adminIDs : [];
        let adminNames = "";
        for (const ad of adminList) {
          try {
            const inf = await api.getUserInfo(ad.id);
            const nm = inf && inf[ad.id] && inf[ad.id].name ? inf[ad.id].name : ad.id;
            adminNames += `• ${nm}\n`;
          } catch (e) {
            adminNames += `• ${ad.id}\n`;
          }
        }
        const approvalMode = threadInfo.approvalMode ? "✅ On" : "❎ Off";
        const msg = `╭── Group Info ──\n├ Name: ${threadInfo.threadName || "Unknown"}\n├ ID: ${threadInfo.threadID}\n├ Emoji: ${threadInfo.emoji || "None"}\n├ Approve: ${approvalMode}\n├ Members: ${threadMem}\n├ Male: ${male}\n├ Female: ${female}\n├ Unknown: ${unknown}\n├ Admins: ${adminList.length}\n${adminNames ? `├ Admin List:\n${adminNames}` : ""}╰────────────────`;
        // send thumbnail too (best-effort)
        try {
          const cacheDir = path.join(__dirname, "cache");
          if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
          const outPath = path.join(cacheDir, `group_${threadID}_thumb.png`);
          // download thread image
          if (threadInfo.imageSrc) {
            if (!request) {
              const axios = tryRequire("axios") || require("axios");
              const resp = await axios.get(threadInfo.imageSrc, { responseType: "arraybuffer", timeout: 15000 });
              fs.writeFileSync(outPath, Buffer.from(resp.data, "binary"));
            } else {
              await new Promise((resolve, reject) => {
                request(encodeURI(threadInfo.imageSrc)).pipe(fs.createWriteStream(outPath)).on("close", resolve).on("error", reject);
              });
            }
            return api.sendMessage({ body: msg, attachment: fs.createReadStream(outPath) }, threadID, (e) => {
              try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (er) {}
            }, messageID);
          } else {
            return api.sendMessage(msg, threadID, messageID);
          }
        } catch (e) {
          console.warn("Could not fetch thread image:", e);
          return api.sendMessage(msg, threadID, messageID);
        }
      } catch (err) {
        console.error("group info error:", err);
        return api.sendMessage("Failed to fetch group info.", threadID, messageID);
      }
    }

    // unknown subcommand
    return api.sendMessage("Unknown subcommand. Use /group name|emoji|image|admin|info", threadID, messageID);

  } catch (err) {
    console.error("group command error:", err && (err.stack || err));
    try { return api.sendMessage("একটি ত্রুটি ঘটেছে — পরে আবার চেষ্টা করুন।", event.threadID, event.messageID); } catch (e) {}
  }
};