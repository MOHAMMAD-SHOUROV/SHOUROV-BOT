module.exports.config = {
  name: "islm",
  version: "1.0.0",
  permission: 0,
  credits: "shourov",
  prefix: true,
  description: "Random Islamic Caption + Image",
  category: "user",
  usages: "",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  // যদি শুধু "/" দেয়, তাহলে args = [] হয় → সেক্ষেত্রে সরাসরি ছবিসহ কন্টেন্ট পাঠাবে
  if (!args || args.length === 0) {
    return sendIslamic(api, event);
  }

  // অন্য কিছু লিখলেও একই ফাংশন চালাবে
  return sendIslamic(api, event);
};

// ------------ MAIN FUNCTION ------------
async function sendIslamic(api, event) {
  const axios = require("axios");
  const fs = require("fs");
  const path = require("path");

  const captions = [
    "আল্লাহর রহমত থেকে নিরাশ হওয়া যাবে না 🌸",
    "ইসলাম অহংকার নয় — ইসলাম বিনয় শেখায় 🖤",
    "পর্দাশীল নারীরা ইসলামের শাহজাদী 🌺",
    "হাজারো স্বপ্নের শেষ ঠিকানা — কবরস্থান 🖤",
    "আল্লাহর ভালোবাসা চাইলে রাসুল (সঃ) কে অনুসরণ করুন 🤲"
  ];

  const images = [
    "https://i.postimg.cc/7LdGnyjQ/images-31.jpg",
    "https://i.postimg.cc/65c81ZDZ/images-30.jpg",
    "https://i.postimg.cc/Y0wvTzr6/images-29.jpg",
    "https://i.postimg.cc/1Rpnw2BJ/images-28.jpg",
    "https://i.postimg.cc/mgrPxDs5/images-27.jpg"
  ];

  const caption = captions[Math.floor(Math.random() * captions.length)];
  const imgURL = images[Math.floor(Math.random() * images.length)];

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
  const filePath = path.join(cacheDir, `islm_${Date.now()}.jpg`);

  try {
    const res = await axios.get(encodeURI(imgURL), { responseType: "stream" });

    const writer = fs.createWriteStream(filePath);
    res.data.pipe(writer);

    writer.on("finish", async () => {
      await api.sendMessage(
        {
          body: `✨ Islamic Caption ✨\n\n${caption}`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlinkSync(filePath)
      );
    });

  } catch (err) {
    console.log(err);
    api.sendMessage("⚠️ সমস্যা হয়েছে, পরে আবার চেষ্টা করুন।", event.threadID);
  }
}
