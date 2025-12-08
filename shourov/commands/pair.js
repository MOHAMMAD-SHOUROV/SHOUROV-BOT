module.exports.config = {
  name: "pair",
  version: "1.0.0",
  permission: 0,          // fixed typo (was hermssion)
  prefix: true,
  credits: "shourov",
  description: "It's a compound :>",
  category: "fun",
  usages: "",
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "canvas": ""
  },
  cooldowns: 15
};

module.exports.run = async function ({ args, Users, Threads, api, event, Currencies }) {
  const { loadImage, createCanvas } = global.nodemodule["canvas"];
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  const { threadID, messageID, senderID } = event;

  const tmpBgPath = __dirname + "/cache/background.png";
  const tmpAvt1 = __dirname + "/cache/Avtmot.png";
  const tmpAvt2 = __dirname + "/cache/Avthai.png";

  try {
    const id1 = senderID;
    const name1 = await Users.getNameUser(id1);

    // fetch thread info and participants
    const threadInfo = await api.getThreadInfo(threadID);
    const participants = threadInfo.userInfo || [];

    // determine gender of sender (if available)
    let gender1 = null;
    for (const p of participants) if (p.id == id1) { gender1 = p.gender; break; }

    const botID = api.getCurrentUserID();
    let candidates = [];

    if (gender1 === "FEMALE") {
      for (const u of participants) {
        if (u.gender === "MALE" && u.id !== id1 && u.id !== botID) candidates.push(u.id);
      }
    } else if (gender1 === "MALE") {
      for (const u of participants) {
        if (u.gender === "FEMALE" && u.id !== id1 && u.id !== botID) candidates.push(u.id);
      }
    } else {
      for (const u of participants) {
        if (u.id !== id1 && u.id !== botID) candidates.push(u.id);
      }
    }

    // If no candidate found with gender filter, fallback to any participant except sender & bot
    if (!candidates || candidates.length === 0) {
      for (const u of participants) {
        if (u.id !== id1 && u.id !== botID) candidates.push(u.id);
      }
    }

    // If still empty, reply and exit
    if (!candidates || candidates.length === 0) {
      return api.sendMessage("No available member to pair with.", threadID, messageID);
    }

    const id2 = candidates[Math.floor(Math.random() * candidates.length)];
    const name2 = await Users.getNameUser(id2);

    // odds generation (kept your original logic)
    const rd1 = Math.floor(Math.random() * 100) + 1;
    const cc = ["0", "-1", "99,99", "-99", "-100", "101", "0,01"];
    const rd2 = cc[Math.floor(Math.random() * cc.length)];
    const djtme = [`${rd1}`, `${rd1}`, `${rd1}`, `${rd1}`, `${rd1}`, `${rd2}`, `${rd1}`, `${rd1}`, `${rd1}`, `${rd1}`];
    const tile = djtme[Math.floor(Math.random() * djtme.length)];

    const backgrounds = [
      "https://i.postimg.cc/wjJ29HRB/background1.png",
      "https://i.postimg.cc/zf4Pnshv/background2.png",
      "https://i.postimg.cc/5tXRQ46D/background3.png"
    ];
    const bgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    // download avatars and background
    const downloadTo = async (url, path) => {
      const res = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(path, Buffer.from(res.data, "binary"));
    };

    // Use Graph API picture endpoint (no token required for basic redirect to image)
    await downloadTo(`https://graph.facebook.com/${id1}/picture?width=720&height=720`, tmpAvt1);
    await downloadTo(`https://graph.facebook.com/${id2}/picture?width=720&height=720`, tmpAvt2);
    await downloadTo(bgUrl, tmpBgPath);

    // build canvas
    const baseImage = await loadImage(tmpBgPath);
    const baseAvt1 = await loadImage(tmpAvt1);
    const baseAvt2 = await loadImage(tmpAvt2);

    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    // draw avatars — positions and sizes kept same as original
    ctx.drawImage(baseAvt1, 100, 150, 300, 300);
    ctx.drawImage(baseAvt2, 900, 150, 300, 300);

    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(tmpBgPath, buffer);

    // cleanup avatar files
    try { fs.removeSync(tmpAvt1); } catch (e) {}
    try { fs.removeSync(tmpAvt2); } catch (e) {}

    // send message with mention
    return api.sendMessage({
      body: `Congratulations, ${name1} successfully paired with ${name2}\nThe odds are ${tile}%`,
      mentions: [{ tag: `${name2}`, id: id2 }],
      attachment: fs.createReadStream(tmpBgPath)
    }, threadID, () => {
      try { fs.unlinkSync(tmpBgPath); } catch (e) {}
    }, messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("An error occurred while pairing. Please try again later.", threadID, messageID);
  }
};