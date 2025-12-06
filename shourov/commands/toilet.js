module.exports.config = {
  name: "toilet",
  version: "1.0.1",
  permission: 0,
  credits: "shourov",
  description: "Put a circular avatar onto a toilet background",
  prefix: true,
  category: "user",
  usages: "@user",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "axios": "",
    "canvas": "",
    "jimp": "",
    "node-superfetch": ""
  }
};

module.exports.circle = async (imageBuffer) => {
  const jimp = global.nodemodule['jimp'];
  const image = await jimp.read(imageBuffer);
  image.circle();
  return await image.getBufferAsync("image/png");
};

module.exports.run = async ({ event, api, args, Users }) => {
  const fs = global.nodemodule["fs-extra"];
  const Canvas = global.nodemodule["canvas"];
  const request = global.nodemodule["node-superfetch"];
  const pathFile = __dirname + '/cache/toilet.png';

  try {
    // determine target id (mentioned user or the sender)
    const mentionIDs = Object.keys(event.mentions || {});
    const targetID = mentionIDs.length ? mentionIDs[0] : event.senderID;

    // prepare canvas
    const width = 500, height = 670;
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // load background (remote)
    const bgURL = 'https://i.imgur.com/Kn7KpAr.jpg';
    const background = await Canvas.loadImage(bgURL);
    ctx.drawImage(background, 0, 0, width, height);

    // fetch Facebook avatar (public endpoint; no token required)
    const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512`;
    const res = await request.get(avatarUrl);
    const circularBuffer = await this.circle(res.body);

    // place avatar (adjust position/size as needed)
    const avatarImage = await Canvas.loadImage(circularBuffer);
    // coordinates from original: x=135, y=350 size=205
    ctx.drawImage(avatarImage, 135, 350, 205, 205);

    // final buffer and save
    const imageBuffer = canvas.toBuffer('image/png');
    await fs.ensureDir(__dirname + '/cache');
    await fs.writeFile(pathFile, imageBuffer);

    // send message with attachment
    await api.sendMessage({
      body: "🐸🐸",
      attachment: fs.createReadStream(pathFile)
    }, event.threadID, async (err) => {
      // cleanup file after sending (ignore error)
      try { await fs.remove(pathFile); } catch (e) {}
      if (err) console.error("sendMessage error:", err);
    }, event.messageID);

  } catch (error) {
    console.error("Toilet command error:", error);
    // attempt to clean up if file exists
    try { if (await fs.pathExists(pathFile)) await fs.remove(pathFile); } catch (e) {}
    // user-friendly error reply
    const msg = (error && error.message) ? `Error: ${error.message}` : "Unknown error while creating image.";
    return api.sendMessage(msg, event.threadID, event.messageID);
  }
};
