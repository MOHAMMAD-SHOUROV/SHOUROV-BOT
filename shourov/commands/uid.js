module.exports.config = {
  name: "uid",
  aliases: ["getuid"],
  version: "1.0.1",
  permission: 0,
  credits: "shourov (fixed)",
  prefix: true,
  description: "Get user id / profile link / profile picture",
  category: "without prefix",
  cooldowns: 5
};

module.exports.run = async function({ event, api, args, Users }) {
  const fs = global.nodemodule["fs-extra"];
  const request = global.nodemodule["request"];
  const axios = global.nodemodule["axios"];

  try {
    const { threadID, messageID } = event;

    // helper: download avatar and send message
    async function sendProfile(uidToSend) {
      const cachePath = __dirname + "/cache/uid_profile.png";
      // ensure cache dir exists
      fs.ensureDirSync(__dirname + "/cache");

      const graphUrl = `https://graph.facebook.com/${uidToSend}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      await new Promise((resolve, reject) => {
        try {
          request(encodeURI(graphUrl))
            .pipe(fs.createWriteStream(cachePath))
            .on("close", resolve)
            .on("error", reject);
        } catch (e) {
          return reject(e);
        }
      });

      const body = `=== [ 𝗨𝗜𝗗 𝗨𝗦𝗘𝗥 ] ====\n━━━━━━━━━━━━━━━━━━\n[ ▶️]➜ 𝗜𝗗: ${uidToSend}\n[ ▶️]➜ 𝗜𝗕: m.me/${uidToSend}\n[ ▶️]➜ 𝗟𝗶𝗻𝗸𝗳𝗯: https://www.facebook.com/profile.php?id=${uidToSend}\n━━━━━━━━━━━━━━━━━━`;

      // send and cleanup
      await api.sendMessage({ body, attachment: fs.createReadStream(cachePath) }, threadID, () => {
        try { fs.unlinkSync(cachePath); } catch (e) {}
      }, messageID);
    }

    // 1) If replied to a message -> target is the replied user's id
    if (event.type === "message_reply" && event.messageReply && event.messageReply.senderID) {
      const targetId = event.messageReply.senderID;
      return await sendProfile(targetId);
    }

    // 2) If no args -> show sender's id
    if (!args || args.length === 0) {
      const myId = event.senderID;
      return await sendProfile(myId);
    }

    // 3) If arg provided
    const input = args.join(" ").trim();

    // If it's a Facebook profile URL -> try api.getUID if available, else fallback to axios (graph)
    if (input.includes(".com/")) {
      let resolved = null;
      // prefer api.getUID if exists
      if (typeof api.getUID === "function") {
        try {
          resolved = await api.getUID(input);
        } catch (e) {
          resolved = null;
        }
      }
      // fallback: try to fetch username/profile id from graph (best-effort)
      if (!resolved) {
        try {
          // Try extracting username from URL and query graph for id
          // Examples: https://www.facebook.com/username  or https://fb.com/profile.php?id=123
          const url = new URL(input);
          const pathname = url.pathname.replace(/^\/+|\/+$/g, "");
          // if profile.php?id= then take id
          const searchParams = url.searchParams;
          if (searchParams.has("id")) {
            resolved = searchParams.get("id");
          } else if (pathname) {
            // attempt graph call by username
            const r = await axios.get(`https://graph.facebook.com/${pathname}`).catch(() => null);
            if (r && r.data && r.data.id) resolved = r.data.id;
          }
        } catch (e) {
          resolved = null;
        }
      }

      if (!resolved) return api.sendMessage("Unable to resolve UID from that URL.", threadID, messageID);
      return await sendProfile(resolved);
    }

    // 4) If mentions (like @name) were used -> pick first mention id
    if (Object.keys(event.mentions || {}).length > 0) {
      const mentionIds = Object.keys(event.mentions);
      const first = mentionIds[0];
      return await sendProfile(first);
    }

    // 5) If numeric id provided directly
    if (/^\d+$/.test(input)) {
      return await sendProfile(input);
    }

    // If none matched, inform user
    return api.sendMessage("Usage:\n- reply to a user's message with this command\n- or send `uid` to get your id\n- or: uid <facebook_link> OR uid <UID> OR reply to a mention", threadID, messageID);

  } catch (err) {
    console.error("UID command error:", err && (err.stack || err));
    try { return api.sendMessage("An error occurred while fetching UID. Try again.", event.threadID, event.messageID); } catch (e) {}
  }
};