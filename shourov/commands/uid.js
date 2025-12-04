module.exports.config = {
  name: "uid",
  aliases: ["getuid"],
  version: "1.0.1",
  permission: 0,
  credits: "shourov",
  prefix: true,
  description: "Get user id and profile picture",
  category: "without prefix",
  cooldowns: 5
};

module.exports.run = async function({ event, api, args, Users }) {
  const fs = global.nodemodule["fs-extra"];
  const path = require("path");
  const axios = global.nodemodule['axios'];

  // Where we store temporary images
  const tmpDir = path.join(__dirname, "cache");
  await fs.ensureDir(tmpDir);
  const outPath = path.join(tmpDir, "uid_avatar.png");

  // Helper: safely cleanup file if exists
  const safeRemove = (p) => {
    try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (e) { /* ignore */ }
  };

  // Determine target uid
  let uid;
  try {
    // 1) Reply to a message: take replied sender
    if (event.type === "message_reply" && event.messageReply && event.messageReply.senderID) {
      uid = event.messageReply.senderID;
    }
    // 2) Mention(s)
    else if (event.mentions && Object.keys(event.mentions).length > 0) {
      uid = Object.keys(event.mentions)[0];
    }
    // 3) Argument provided
    else if (args && args[0]) {
      const arg = args[0].trim();

      // If looks like facebook link, try api.getUID
      if (arg.includes(".com/") || arg.includes("facebook.com")) {
        try {
          // api.getUID can be synchronous-callback style; handle both promise & callback forms
          uid = await new Promise((resolve, reject) => {
            try {
              api.getUID(arg, (err, res) => {
                if (err) return reject(err);
                resolve(res);
              });
            } catch (err) {
              reject(err);
            }
          });
        } catch (err) {
          // fallback: try to extract numeric id from query string if present
          const m = arg.match(/id=(\d+)/);
          if (m) uid = m[1];
          else {
            safeRemove(outPath);
            return api.sendMessage("❗ Failed to resolve Facebook link to UID.", event.threadID, event.messageID);
          }
        }
      }
      // If pure numeric id
      else if (/^\d+$/.test(arg)) {
        uid = arg;
      }
      // If the arg is something else, fallback to sender
      else {
        uid = event.senderID;
      }
    }
    // 4) Default: the command sender
    else {
      uid = event.senderID;
    }

    // Make sure uid resolved
    if (!uid) {
      return api.sendMessage("❗ Could not determine UID.", event.threadID, event.messageID);
    }

    // Fetch profile picture from Facebook Graph
    // NOTE: it's better to store access token in config or env; using public app token here if you must.
    const ACCESS_TOKEN = process.env.FB_APP_TOKEN || "6628568379|c1e620fa708a1d5696fb991c1bde5662";

    const picUrl = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=${encodeURIComponent(ACCESS_TOKEN)}`;

    const res = await axios.get(picUrl, { responseType: "arraybuffer", validateStatus: s => s >= 200 && s < 400 })
      .catch(err => null);

    if (!res || !res.data) {
      // still send textual info even if picture failed
      safeRemove(outPath);
      return api.sendMessage(
        `=== [ 𝗨𝗜𝗗 𝗨𝗦𝗘𝗥 ] ====\n━━━━━━━━━━━━━━━━━━\n[ ▶️]➜ 𝗜𝗗: ${uid}\n[ ▶️]➜ 𝗜𝗕: m.me/${uid}\n[ ▶️]➜ 𝗟𝗶𝗻𝗸𝗳𝗯: https://www.facebook.com/profile.php?id=${uid}\n━━━━━━━━━━━━━━━━━━\n(avatar fetch failed)`,
        event.threadID, event.messageID
      );
    }

    // Write image to file and send
    await fs.writeFile(outPath, Buffer.from(res.data, "binary"));

    const body = `=== [ 𝗨𝗜𝗗 𝗨𝗦𝗘𝗥 ] ====\n━━━━━━━━━━━━━━━━━━\n[ ▶️]➜ 𝗜𝗗: ${uid}\n[ ▶️]➜ 𝗜𝗕: m.me/${uid}\n[ ▶️]➜ 𝗟𝗶𝗻𝗸𝗳𝗯: https://www.facebook.com/profile.php?id=${uid}\n━━━━━━━━━━━━━━━━━━`;

    await api.sendMessage({ body, attachment: fs.createReadStream(outPath) }, event.threadID, async (err) => {
      // cleanup after send (best-effort)
      safeRemove(outPath);
    }, event.messageID);

  } catch (error) {
    safeRemove(outPath);
    console.error("UID command error:", error);
    return api.sendMessage("❗ An error occurred while fetching UID. See console for details.", event.threadID, event.messageID);
  }
};