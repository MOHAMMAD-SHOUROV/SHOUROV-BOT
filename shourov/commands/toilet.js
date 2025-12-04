module.exports.config = {
  name: "toilet",
  version: "1.0.1",
  permission: 0,
  credits: "shourov",
  description: "Put user's avatar on a toilet image",
  prefix: true,
  category: "user",
  usages: "@user",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "canvas": "",
    "jimp": "",
    "node-superfetch": ""
  }
};

module.exports.circle = async (imageBuffer) => {
  const jimp = global.nodemodule['jimp'];
  const img = await jimp.read(imageBuffer);
  img.circle();
  return await img.getBufferAsync("image/png");
};

module.exports.run = async ({ event, api, args, Users }) => {
  const Canvas = global.nodemodule['canvas'];
  const request = global.nodemodule["node-superfetch"];
  const fs = global.nodemodule["fs-extra"];
  const path = require("path");

  const tmpDir = __dirname + "/cache";
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const path_toilet = path.join(tmpDir, `toilet_${Date.now()}.png`);

  try {
    // choose the target id: mentioned user or sender
    const mentionIds = Object.keys(event.mentions || {});
    const id = mentionIds.length > 0 ? mentionIds[0] : event.senderID;

    // background image url (same as your original)
    const backgroundUrl = 'https://i.imgur.com/Kn7KpAr.jpg';

    // Use your config or environment for tokens — avoid hardcoding in production
    const fbAccessToken = global.config && global.config.FB_ACCESS_TOKEN ? global.config.FB_ACCESS_TOKEN : "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

    // download avatar and background concurrently
    const [bgResp, avatarResp] = await Promise.all([
      request.get(backgroundUrl, { encoding: null }),
      request.get(`https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=${fbAccessToken}`, { encoding: null })
    ]);

    const avatarCircleBuffer = await this.circle(avatarResp.body);

    // create canvas and draw
    const canvas = Canvas.createCanvas(500, 670);
    const ctx = canvas.getContext('2d');

    const backgroundImg = await Canvas.loadImage(bgResp.body);
    const avatarImg = await Canvas.loadImage(avatarCircleBuffer);

    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    // position & size based on your original values
    ctx.drawImage(avatarImg, 135, 350, 205, 205);

    const outputBuffer = canvas.toBuffer("image/png");
    await fs.writeFile(path_toilet, outputBuffer);

    // send and cleanup
    api.sendMessage({
      body: "🐸🐸",
      attachment: fs.createReadStream(path_toilet)
    }, event.threadID, (err, info) => {
      // remove temp file after sending (best-effort)
      try { if (fs.existsSync(path_toilet)) fs.unlinkSync(path_toilet); } catch (e) { /* ignore */ }
      if (err) console.error("Send error:", err);
    }, event.messageID);

  } catch (err) {
    console.error(err);
    // try to send a friendly error message
    try {
      api.sendMessage(`An error occurred:\n${err.message || err}`, event.threadID, event.messageID);
    } catch (e) { /* ignore */ }
    // cleanup file if created
    try { if (fs.existsSync(path_toilet)) fs.unlinkSync(path_toilet); } catch (e) { /* ignore */ }
  }
};