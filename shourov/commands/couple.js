// commands/couple.js
module.exports.config = {
  name: "couple",
  version: "1.0.4",
  permission: 0,
  credits: "Shourov (fixed)",
  description: "Create cute couple image with avatars",
  prefix: true,
  category: "fun",
  usages: "/couple @tag",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "jimp": ""
  }
};

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

const DIR = path.join(__dirname, "cache", "canvas");
const TEMPLATE = path.join(DIR, "seophi.png");

// Helper - create a simple fallback template with jimp
async function generateFallbackTemplate(dest) {
  try {
    const img = new jimp(1024, 650, "#ffffff"); // white background
    // draw two rounded rectangles to represent photo slots
    const slot = new jimp(220, 220, "#e9e9e9");
    slot.circle();
    img.composite(slot, 380, 140); // left
    img.composite(slot, 520, 340); // right
    // write some text (requires jimp fonts)
    const font = await jimp.loadFont(jimp.FONT_SANS_32_BLACK);
    img.print(font, 20, 20, "Couple Template (fallback)");
    await img.writeAsync(dest);
    console.log("couple: fallback template created at", dest);
  } catch (e) {
    console.error("couple: failed to generate fallback template:", e);
    throw e;
  }
}

// onLoad: ensure template exists (download or fallback)
module.exports.onLoad = async () => {
  try {
    await fs.ensureDir(DIR);

    if (await fs.pathExists(TEMPLATE)) {
      console.log("couple: template already exists.");
      return;
    }

    // Try download template
    const TEMPLATE_URL = "https://i.imgur.com/hmKmmam.jpg"; // primary
    console.log("couple: attempting to download template...");

    try {
      const res = await axios.get(TEMPLATE_URL, { responseType: "arraybuffer", timeout: 20000 });
      await fs.writeFile(TEMPLATE, Buffer.from(res.data, "binary"));
      console.log("couple: downloaded template to", TEMPLATE);
      return;
    } catch (err) {
      console.warn("couple: template download failed:", err && err.message ? err.message : err);
      // try a second known URL as fallback
      const SECONDARY = "https://i.imgur.com/vy3Tn0X.png";
      try {
        const res2 = await axios.get(SECONDARY, { responseType: "arraybuffer", timeout: 20000 });
        await fs.writeFile(TEMPLATE, Buffer.from(res2.data, "binary"));
        console.log("couple: downloaded secondary template to", TEMPLATE);
        return;
      } catch (err2) {
        console.warn("couple: secondary download failed:", err2 && err2.message ? err2.message : err2);
      }
    }

    // final fallback: generate a simple template
    await generateFallbackTemplate(TEMPLATE);

  } catch (e) {
    console.error("couple.onLoad error:", e && (e.stack || e));
  }
};

async function circle(imagePathOrBuffer) {
  const img = await jimp.read(imagePathOrBuffer);
  img.circle();
  return await img.getBufferAsync(jimp.MIME_PNG);
}

async function makeImage({ one, two }) {
  try {
    const base = await jimp.read(TEMPLATE);
    // ensure size
    base.resize(1024, 650);

    // download avatars
    const avatarOnePath = path.join(DIR, `avt_${one}.png`);
    const avatarTwoPath = path.join(DIR, `avt_${two}.png`);

    // helper to get avatar buffer (with fallback)
    async function downloadAvatar(id, outPath) {
      try {
        const res = await axios.get(`https://graph.facebook.com/${id}/picture?width=512&height=512`, {
          responseType: "arraybuffer",
          timeout: 15000
        });
        await fs.writeFile(outPath, Buffer.from(res.data, "binary"));
        return outPath;
      } catch (e) {
        // create placeholder
        const placeholder = new jimp(512, 512, "#999999");
        const f = await jimp.loadFont(jimp.FONT_SANS_32_WHITE);
        placeholder.print(f, 20, 220, "No Avatar");
        await placeholder.writeAsync(outPath);
        return outPath;
      }
    }

    await downloadAvatar(one, avatarOnePath);
    await downloadAvatar(two, avatarTwoPath);

    const circ1Buf = await circle(avatarOnePath);
    const circ2Buf = await circle(avatarTwoPath);

    const circ1 = await jimp.read(circ1Buf);
    const circ2 = await jimp.read(circ2Buf);

    // positions are tuned for base 1024x650
    base.composite(circ1.resize(200, 200), 520, 120); // may adjust coords
    base.composite(circ2.resize(200, 200), 360, 360);

    const outPath = path.join(DIR, `couple_${one}_${two}_${Date.now()}.png`);
    await base.writeAsync(outPath);

    // remove temp avatars
    await fs.remove(avatarOnePath).catch(()=>{});
    await fs.remove(avatarTwoPath).catch(()=>{});

    return outPath;
  } catch (err) {
    console.error("couple.makeImage error:", err && (err.stack || err));
    throw err;
  }
}

module.exports.run = async function ({ event, api }) {
  const { threadID, messageID, senderID, mentions } = event;

  try {
    if (!mentions || Object.keys(mentions).length === 0) {
      return api.sendMessage("Please tag someone to make couple image.", threadID, messageID);
    }
    const target = Object.keys(mentions)[0];

    if (!await fs.pathExists(TEMPLATE)) {
      console.error("couple: TEMPLATE not found when running command.");
      return api.sendMessage("❌ Error: Template missing (couple). Check bot console logs.", threadID, messageID);
    }

    const out = await makeImage({ one: senderID, two: target });
    const mentionText = typeof event.mentions[target] === "string" ? event.mentions[target] : (event.mentions[target].name || `@${target}`);

    await api.sendMessage({
      body: `Ship ${mentionText} ❤`,
      mentions: [{ tag: mentionText, id: target }],
      attachment: fs.createReadStream(out)
    }, threadID, () => {
      fs.remove(out).catch(()=>{});
    }, messageID);

  } catch (err) {
    console.error("couple.run error:", err && (err.stack || err));
    return api.sendMessage("❌ Something went wrong. Check console logs.", threadID, messageID);
  }
};