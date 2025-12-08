const fs = global.nodemodule["fs-extra"];
const path = require("path");
const axios = global.nodemodule["axios"];

module.exports.config = {
  name: "uid",
  aliases: ["getuid"],
  version: "1.0.2",
  permission: 0,
  credits: "shourov",
  prefix: true,
  description: "Get user id / profile link / profile picture",
  category: "without prefix",
  cooldowns: 5
};

module.exports.run = async function({ event, api, args }) {
  const { threadID, messageID } = event;
  // prepare cache directory and file
  const cacheDir = path.resolve(__dirname, "cache");
  fs.ensureDirSync(cacheDir);

  // helper: download picture and send
  async function sendProfile(uidToSend) {
    const cachePath = path.join(cacheDir, `uid_profile_${uidToSend}.jpg`);
    const graphUrl = `https://graph.facebook.com/${uidToSend}/picture?height=1500&width=1500`;

    let wroteFile = false;
    try {
      // fetch image as arraybuffer
      const resp = await axios.get(encodeURI(graphUrl), {
        responseType: "arraybuffer",
        timeout: 15000,
        maxRedirects: 5
      });

      const contentType = (resp.headers && resp.headers["content-type"]) || "";
      // ensure we got an image
      if (!contentType.startsWith("image/")) {
        throw new Error("Graph returned non-image content.");
      }

      fs.writeFileSync(cachePath, Buffer.from(resp.data));
      wroteFile = true;

      const body = [
        "=== [ 𝗨𝗜𝗗 𝗨𝗦𝗘𝗥 ] ====",
        "━━━━━━━━━━━━━━━━━━",
        `[ ▶️]➜ 𝗜𝗗: ${uidToSend}`,
        `[ ▶️]➜ 𝗜𝗕: m.me/${uidToSend}`,
        `[ ▶️]➜ 𝗟𝗶𝗻𝗸𝗳𝗯: https://www.facebook.com/profile.php?id=${uidToSend}`,
        "━━━━━━━━━━━━━━━━━━"
      ].join("\n");

      await api.sendMessage({ body, attachment: fs.createReadStream(cachePath) }, threadID, () => {}, messageID);
    } finally {
      // cleanup: best effort
      try {
        if (wroteFile && fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      } catch (e) {
        console.warn("Failed to cleanup cache file:", e && e.message);
      }
    }
  }

  try {
    // 1) replied message -> target is replied user
    if (event.type === "message_reply" && event.messageReply && event.messageReply.senderID) {
      return await sendProfile(event.messageReply.senderID);
    }

    // 2) no args -> sender's id
    if (!args || args.length === 0) {
      return await sendProfile(event.senderID);
    }

    const input = args.join(" ").trim();

    // 3) if mention(s) exist -> first mention
    if (event.mentions && Object.keys(event.mentions).length > 0) {
      const mentionIds = Object.keys(event.mentions);
      return await sendProfile(mentionIds[0]);
    }

    // 4) if input looks like numeric id
    if (/^\d+$/.test(input)) {
      return await sendProfile(input);
    }

    // 5) if input contains a .com/ assume Facebook profile link
    if (input.includes(".com/") || input.includes("facebook.com") || input.includes("fb.com")) {
      let resolved = null;
      // prefer api.getUID if present
      if (typeof api.getUID === "function") {
        try {
          resolved = await api.getUID(input);
        } catch (e) {
          resolved = null;
        }
      }

      // fallback: parse URL and try to query Graph
      if (!resolved) {
        try {
          const url = new URL(input.startsWith("http") ? input : `https://${input}`);
          // check for profile.php?id=
          const idFromQuery = url.searchParams.get("id");
          if (idFromQuery && /^\d+$/.test(idFromQuery)) {
            resolved = idFromQuery;
          } else {
            // path may be username or profile.php
            let pathname = url.pathname.replace(/^\/+|\/+$/g, ""); // remove slashes
            if (pathname) {
              // try Graph on pathname (username)
              const r = await axios.get(`https://graph.facebook.com/${pathname}`, { timeout: 10000 }).catch(() => null);
              if (r && r.data && r.data.id) resolved = r.data.id;
            }
          }
        } catch (e) {
          resolved = null;
        }
      }

      if (!resolved) {
        return api.sendMessage("Unable to resolve UID from that URL.", threadID, messageID);
      }
      return await sendProfile(resolved);
    }

    // fallback: help message
    return api.sendMessage(
      "Usage:\n- reply to a user's message with this command\n- or send `uid` to get your id\n- or: uid <facebook_link> OR uid <UID> OR reply to a mention",
      threadID,
      messageID
    );
  } catch (err) {
    console.error("UID command error:", err && (err.stack || err));
    try {
      return api.sendMessage("An error occurred while fetching UID. Try again.", threadID, messageID);
    } catch (e) { /* ignore send error */ }
  }
};