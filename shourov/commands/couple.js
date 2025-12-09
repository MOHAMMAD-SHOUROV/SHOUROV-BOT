// commands/couple.js
module.exports.config = {
  name: "couple",
  version: "1.0.3",
  permission: 0,
  credits: "Shourov",
  description: "Create cute couple image",
  prefix: true,
  category: "fun",
  usages: "/couple @tag",
  cooldowns: 5
};

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports.onLoad = async () => {
  const dir = path.join(__dirname, "cache", "canvas");
  const baseImg = path.join(dir, "seophi.png");

  try {
    await fs.ensureDir(dir);

    // New working template URL
    const url = "https://i.imgur.com/vy3Tn0X.png";

    if (!fs.existsSync(baseImg)) {
      const res = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
      fs.writeFileSync(baseImg, Buffer.from(res.data));
      console.log("Couple: Base template downloaded.");
    }
  } catch (err) {
    console.error("couple.onLoad:", err);
  }
};

async function circle(imgPath) {
  const image = await jimp.read(imgPath);
  image.circle();
  return await image.getBufferAsync("image/png");
}

async function makeImage(one, two) {
  const dir = path.join(__dirname, "cache", "canvas");
  const baseImg = path.join(dir, "seophi.png");

  if (!fs.existsSync(baseImg)) throw new Error("Template missing");

  const out = path.join(dir, `couple_${Date.now()}.png`);
  const av1 = path.join(dir, `${one}.png`);
  const av2 = path.join(dir, `${two}.png`);

  // Download avatars
  try {
    const a1 = await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512`,
      { responseType: "arraybuffer" });
    fs.writeFileSync(av1, Buffer.from(a1.data));
  } catch {
    fs.writeFileSync(av1, await new jimp(512, 512, "#666").getBufferAsync(jimp.MIME_PNG));
  }

  try {
    const a2 = await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512`,
      { responseType: "arraybuffer" });
    fs.writeFileSync(av2, Buffer.from(a2.data));
  } catch {
    fs.writeFileSync(av2, await new jimp(512, 512, "#777").getBufferAsync(jimp.MIME_PNG));
  }

  // Process
  const base = await jimp.read(baseImg);
  const c1 = await circle(av1);
  const c2 = await circle(av2);

  const circ1 = await jimp.read(c1);
  const circ2 = await jimp.read(c2);

  base.resize(1024, 650);
  base.composite(circ1.resize(180, 180), 520, 140);
  base.composite(circ2.resize(180, 180), 380, 380);

  fs.writeFileSync(out, await base.getBufferAsync("image/png"));

  // cleanup
  fs.unlink(av1).catch(()=>{});
  fs.unlink(av2).catch(()=>{});

  return out;
}

module.exports.run = async ({ event, api }) => {
  const { threadID, messageID, senderID, mentions } = event;

  try {
    if (!mentions || Object.keys(mentions).length === 0)
      return api.sendMessage("Please tag someone!", threadID, messageID);

    const target = Object.keys(mentions)[0];
    const out = await makeImage(senderID, target);

    return api.sendMessage(
      {
        body: `❤ ${mentions[target]} + You`,
        mentions: [{ id: target, tag: mentions[target] }],
        attachment: fs.createReadStream(out)
      },
      threadID,
      () => fs.unlink(out),
      messageID
    );

  } catch (err) {
    console.error("Couple Error:", err);
    return api.sendMessage("❌ Error: " + err.message, threadID, messageID);
  }
};