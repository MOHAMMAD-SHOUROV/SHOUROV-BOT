// commands/sad.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { pipeline } = require("stream");
const { promisify } = require("util");
const streamPipeline = promisify(pipeline);

module.exports.config = {
  name: "sad",
  version: "1.0.1",
  permission: 0,
  credits: "(fixed by Shourov)",
  description: "Random sad video",
  prefix: true,
  category: "Media",
  usages: "Sadvideo",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": ""
  }
};

module.exports.run = async function ({ api, event }) {
  // caption list (আপনি চাইলে এখানে আরো যোগ করতে পারবেন)
  const captions = [
    "❝ Life Is Beautiful If You Don’t Fall In Love ❞ ♡︎ জীবন সুন্দর যদি কারো মায়ায় না পড়ো 🙂💔",
    "❝ হঠাৎ করে দূরে সরে যাবো একদিন, তখন খুঁজে পাবে… ❞",
    "❝ হঠাৎ একদিন দেখা হবে °কিন্তু° কথা হবে না 🖤 ❞",
    "🌸 কোনো এক মায়াবতীর জন্য আজও ভিতরটা পোড়ে ︵😌🤍🪽",
    "❝ তুমি গল্প হইও গল্প না, তুমি সত্যি হইও কল্পনা ❞",
    "❝ ভাঙা মন আর ভাঙা বিশ্বাস কোনোদিন জোড়া লাগে না… ❞",
    "❝ সে বলেছিলো কোনোদিন সেরে যাবে না… তাহলে চলে গেছে কেন? ❞",
    "❝ তোমার অবহেলা আমাকে শিখিয়েছে—নিঃশব্দে দূরে চলে যাওয়াই হলো সবচেয়ে বড় শাস্তি! ❞",
    "--SAD🥀-𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯-"
  ];

  // media links (Google Drive direct download style / other direct hosts)
  const mediaLinks = [
    "https://drive.google.com/uc?id=1XKFx79hyaXe0txe75DMMBPOqqKFCKN3",
    "https://drive.google.com/uc?id=1XdEXMLrU8JwYFvbaQoMQHJmwoWL1_Dig",
    "https://drive.google.com/uc?id=1X6Ui8VWseukemFxExr5mwbFDcA-w18yu",
    "https://drive.google.com/uc?id=1XcYr568sImaE__20X_un3NHxnJEwWfrL",
    "https://drive.google.com/uc?id=1X9rHTos8DH-KXZJDtF2wCkibKYWY3L1g",
    "https://drive.google.com/uc?id=1XAe-R-jKFXcaEU8sr9BF0dMPCJEFlBiQ",
    "https://drive.google.com/uc?id=1XHeGi9evbPc7feHd_ZEdBFsAv24uG7Fb",
    "https://drive.google.com/uc?id=1X9N3gjPDiutDP1wHHNFu85F33JmzUBC_",
    "https://drive.google.com/uc?id=1XInpM6JXOvl-yUiSbKs47ZHp5_KvTsKo",
    "https://drive.google.com/uc?id=1X9rHTos8DH-KXZJDtF2wCkibKYWY3L1g"
  ];

  const quote = captions[Math.floor(Math.random() * captions.length)];
  const chosenLink = mediaLinks[Math.floor(Math.random() * mediaLinks.length)];

  const cacheDir = path.join(__dirname, "cache");
  const tmpName = `15_${Date.now()}_${Math.floor(Math.random() * 10000)}.mp4`;
  const filePath = path.join(cacheDir, tmpName);

  try {
    await fs.ensureDir(cacheDir);

    // Axios stream request with timeout
    const res = await axios.get(encodeURI(chosenLink), {
      responseType: "stream",
      headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
      timeout: 30000
    });

    // save stream to file
    await streamPipeline(res.data, fs.createWriteStream(filePath));

    // send message with attachment, then cleanup
    await new Promise((resolve, reject) => {
      api.sendMessage({
        body: `「 ${quote} 」`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, (err) => {
        // best-effort cleanup
        fs.pathExists(filePath).then(exists => {
          if (exists) fs.unlink(filePath).catch(() => {});
        });
        if (err) return reject(err);
        resolve();
      }, event.messageID);
    });

  } catch (err) {
    console.error("sad command error:", err && (err.stack || err.message || err));
    // cleanup if file created
    try {
      if (await fs.pathExists(filePath)) await fs.unlink(filePath);
    } catch (e) {}
    return api.sendMessage("❌ ভিডিও লোড বা পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।", event.threadID, event.messageID);
  }
};