module.exports.config = {
  name: "couple",
  version: "3.0.0",
  permission: 0,
  prefix: true,
  credits: "Shourov (Final Fixed Version)",
  description: "Create couple image",
  category: "fun",
  usages: "/couple @tag",
  cooldowns: 5
};

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

// template stored in SAME folder as couple.js
const TEMPLATE = path.join(__dirname, "seophi.png");

// =============================
// Auto-create Template
// =============================
async function ensureTemplate() {
  if (await fs.pathExists(TEMPLATE)) return;

  console.log("COUPLE: Template missing. Creating fallback template...");

  // create fallback template image
  const img = new jimp(1024, 650, "#ffffff");
  const slot = new jimp(240, 240, "#d9d9d9");
  slot.circle();

  img.composite(slot, 380, 120);
  img.composite(slot, 500, 360);

  const font = await jimp.loadFont(jimp.FONT_SANS_32_BLACK);
  img.print(font, 20, 20, "Couple Template Generated");

  await img.writeAsync(TEMPLATE);

  console.log("COUPLE: Fallback template created.");
}

async function circle(buffer) {
  const img = await jimp.read(buffer);
  img.circle();
  return await img.getBufferAsync(jimp.MIME_PNG);
}

// =============================
// Make Final Image
// =============================
async function makeCoupleImage(uid1, uid2) {
  await ensureTemplate();

  const base = await jimp.read(TEMPLATE);

  async function getAvatar(uid) {
    try {
      const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512`;
      const res = await axios.get(url, { responseType: "arraybuffer" });
      return Buffer.from(res.data);
    } catch {
      const fallback = new jimp(512, 512, "#888");
      return await fallback.getBufferAsync(jimp.MIME_PNG);
    }
  }

  const av1 = await getAvatar(uid1);
  const av2 = await getAvatar(uid2);

  const c1 = await circle(av1);
  const c2 = await circle(av2);

  const a1 = await jimp.read(c1);
  const a2 = await jimp.read(c2);

  base.resize(1024, 650);
  base.composite(a1.resize(220, 220), 380, 120);
  base.composite(a2.resize(220, 220), 500, 360);

  const output = path.join(__dirname, `couple_${uid1}_${uid2}_${Date.now()}.png`);
  await base.writeAsync(output);

  return output;
}

// =============================
// Command Handler
// =============================
module.exports.run = async function ({ event, api }) {
  const { threadID, messageID, senderID, mentions } = event;

  if (!mentions || Object.keys(mentions).length < 1) {
    return api.sendMessage("Please tag someone.", threadID, messageID);
  }

  const target = Object.keys(mentions)[0];

  try {
    const finalImage = await makeCoupleImage(senderID, target);

    const tagName = event.mentions[target] || "User";

    await api.sendMessage(
      {
        body: `Ship ❤️ ${tagName}`,
        mentions: [{ tag: tagName, id: target }],
        attachment: fs.createReadStream(finalImage)
      },
      threadID,
      () => fs.unlink(finalImage),
      messageID
    );

  } catch (err) {
    console.log("COUPLE ERROR:", err);
    return api.sendMessage("❌ Error creating couple image.", threadID, messageID);
  }
};