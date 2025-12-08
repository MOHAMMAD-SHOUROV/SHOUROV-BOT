module.exports.config = {
  name: "pairv2",
  version: "1.0.1",
  permission: 0,           // fixed typo (was permssion)
  prefix: true,
  credits: "shourov",
  description: "",
  category: "Picture",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": ""
  }
};

module.exports.onLoad = async () => {
  const path = global.nodemodule["path"];
  const fs = global.nodemodule["fs-extra"];
  const { downloadFile } = global.utils;
  const dirMaterial = path.resolve(__dirname, "cache", "canvas");
  const pairingPath = path.resolve(dirMaterial, "pairing.png");

  if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });
  if (!fs.existsSync(pairingPath)) {
    await downloadFile("https://i.postimg.cc/X7R3CLmb/267378493-3075346446127866-4722502659615516429-n.png", pairingPath);
  }
};

async function circle(imagePath) {
  const jimp = global.nodemodule["jimp"];
  let img = await jimp.read(imagePath);
  img.circle();
  return await img.getBufferAsync("image/png");
}

async function makeImage({ one, two }) {
  const fs = global.nodemodule["fs-extra"];
  const path = global.nodemodule["path"];
  const axios = global.nodemodule["axios"];
  const jimp = global.nodemodule["jimp"];
  const __root = path.resolve(__dirname, "cache", "canvas");

  const pairingImgPath = path.join(__root, "pairing.png");
  const outPath = path.join(__root, `pairing_${one}_${two}.png`);
  const avatarOnePath = path.join(__root, `avt_${one}.png`);
  const avatarTwoPath = path.join(__root, `avt_${two}.png`);

  // read base image
  let pairing_img = await jimp.read(pairingImgPath);

  // download avatars (use Graph API picture endpoint)
  const getAvatar = async (uid, savePath) => {
    const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512`;
    const res = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(savePath, Buffer.from(res.data, "binary"));
  };

  await getAvatar(one, avatarOnePath);
  await getAvatar(two, avatarTwoPath);

  // make circular avatars
  let circleOneBuf = await circle(avatarOnePath);
  let circleTwoBuf = await circle(avatarTwoPath);

  let circleOne = await jimp.read(circleOneBuf);
  let circleTwo = await jimp.read(circleTwoBuf);

  // compose on template (positions preserved from original)
  pairing_img
    .composite(circleOne.resize(150, 150), 980, 200)
    .composite(circleTwo.resize(150, 150), 140, 200);

  const raw = await pairing_img.getBufferAsync("image/png");
  fs.writeFileSync(outPath, raw);

  // cleanup avatars
  try { fs.unlinkSync(avatarOnePath); } catch (e) {}
  try { fs.unlinkSync(avatarTwoPath); } catch (e) {}

  return outPath;
}

module.exports.run = async function ({ api, event, args, Users, Threads, Currencies }) {
  const axios = global.nodemodule["axios"];
  const fs = global.nodemodule["fs-extra"];
  const { threadID, messageID, senderID } = event;

  try {
    // pick random "odds" text
    const oddsList = ['21%', '67%', '19%', '37%', '17%', '96%', '52%', '62%', '76%', '83%', '100%', '99%', "0%", "48%"];
    const odds = oddsList[Math.floor(Math.random() * oddsList.length)];

    // get sender name
    const meInfo = await api.getUserInfo(senderID);
    const senderName = (meInfo && meInfo[senderID] && meInfo[senderID].name) ? meInfo[senderID].name : "Unknown";

    // pick random participant from thread (excluding bot itself is optional)
    const threadInfo = await api.getThreadInfo(threadID);
    const participants = threadInfo.participantIDs || [];
    if (participants.length === 0) return api.sendMessage("No participants found in this thread.", threadID, messageID);

    // ensure we don't pick the same user as sender
    let id = senderID;
    if (participants.length > 1) {
      do {
        id = participants[Math.floor(Math.random() * participants.length)];
      } while (id == senderID && participants.length > 1);
    }

    const otherInfo = await api.getUserInfo(id);
    const otherName = (otherInfo && otherInfo[id] && otherInfo[id].name) ? otherInfo[id].name : "Unknown";

    const mentions = [
      { id: senderID, tag: senderName },
      { id: id, tag: otherName }
    ];

    const one = senderID;
    const two = id;

    const imagePath = await makeImage({ one, two });

    return api.sendMessage({
      body: `Congratulations ${senderName} is paired with ${otherName}\nThe odds are: 〘${odds}〙`,
      mentions,
      attachment: fs.createReadStream(imagePath)
    }, threadID, (err) => {
      try { fs.unlinkSync(imagePath); } catch (e) {}
    }, messageID);

  } catch (e) {
    console.error(e);
    return api.sendMessage("An error occurred while creating the image.", threadID, messageID);
  }
};