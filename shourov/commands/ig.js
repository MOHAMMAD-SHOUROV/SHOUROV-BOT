/** Respect the credits — Edited & Styled by your request */
module.exports.config = {
  name: "ig",
  version: "1.0.0",
  permission: 0,
  credits: "shourov",
  prefix: true,
  description: "Random Islamic Caption + Image",
  category: "user",
  usages: "",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  // Prefer loader-provided modules if available
  const axios = (global.nodemodule && global.nodemodule['axios']) ? global.nodemodule['axios'] : require('axios');
  const fs = (global.nodemodule && (global.nodemodule['fs-extra'] || global.nodemodule['fs'])) ? (global.nodemodule['fs-extra'] || global.nodemodule['fs']) : require('fs');
  const path = require('path');

  // Helper: safe file unlink
  const safeUnlink = (p) => {
    try { if (fs.existsSync && fs.existsSync(p)) fs.unlinkSync(p); else if (fs.unlinkSync) fs.unlinkSync(p); } catch (e) { /* ignore */ }
  };

  // Captions
  const captions = [
    "ღ••\n– কোনো নেতার পিছনে নয়🤸‍♂️\n– মসজিদের ইমামের পিছনে দাড়াও, জীবন বদলে যাবে ইনশাআল্লাহ🖤🌻\n۵",
    "- “আল্লাহর রহমত থেকে নিরাশ হওয়া যাবে না।”☺️🌻\nসুরা যুমার আয়াত ৫২-৫৩💙🌸",
    "- ইসলাম অহংকার নয় 🌸\n— ইসলাম শুকরিয়া আদায় করতে শেখায় 🤲🕋🥀",
    "- বেপর্দা নারী যদি নায়িকা হয় 🤗🥀\n— তবে পর্দাশীল নারীরা ইসলামের শাহজাদী 🌺🥰 মাশাল্লাহ।",
    "┏━━━━ ﷽ ━━━━┓\n 🖤 স্মার্ট নয়, ইসলামিক জীবনসঙ্গী খুঁজুন 🕋🥰\n┗━━━━ ﷽ ━━━━┛",
    "ღ বান্দার জ্বর হলে 😇\n🖤 গুনাহ গুলো ঝরে পড়ে— রাসুল (সঃ) •───༊༆",
    "~🍂🦋\nHappiness is enjoying the little things…♡🌸\nAlhamdulillah for everything 💗",
    "•___💜🦋___•\nতুমি নেশায় নয় — আল্লাহর ইবাদতে আসক্ত হও 🖤🌸✨",
    "─❝হাসতে হাসতে একদিন 😊\n━❥সবাইকে কাঁদিয়ে বিদায় নিবো🙂💔🥀",
    "🦋🥀 হাজারো স্বপ্নের শেষ ঠিকানা🙂🤲🥀\n♡— কবরস্থান —♡ 🖤",
    "প্রসঙ্গ যখন ধর্ম 😊\n— ইসলামই সেরা ❤️ Alhamdulillah 🌸",
    "🥀😒 কেউ পছন্দ না করলে কী যায় আসে? 🙂\nআল্লাহ তো ভালোবেসেই বানিয়েছেন ♥️🕋",
    "🌼 অহংকার না করে মনে রাখো:\nমৃত্যু নিশ্চিত — শুধু সময় অনিশ্চিত 🖤🙂",
    "🌻 অতীতের পাপ ছিঁড়ে ফেলুন;\nফিরে আসুন রাব্বের ভালোবাসায় 🖤🥀",
    "বুকভরা কষ্ট নিয়েও ‘আলহামদুলিল্লাহ’ বলা—\nআল্লাহর প্রতি অগাধ বিশ্বাসের নিদর্শন ❤️🥀",
    "আল্লাহর ভালোবাসা চাইলে— রাসুল (সঃ) কে অনুসরণ করুন 🥰🤲"
  ];

  // Images
  const images = [
    "https://i.postimg.cc/7LdGnyjQ/images-31.jpg",
    "https://i.postimg.cc/65c81ZDZ/images-30.jpg",
    "https://i.postimg.cc/Y0wvTzr6/images-29.jpg",
    "https://i.postimg.cc/1Rpnw2BJ/images-28.jpg",
    "https://i.postimg.cc/mgrPxDs5/images-27.jpg",
    "https://i.postimg.cc/yxXDK3xw/images-26.jpg",
    "https://i.postimg.cc/kXqVcsh9/muslim-boy-having-worship-praying-fasting-eid-islamic-culture-mosque-73899-1334.webp",
    "https://i.postimg.cc/hGzhj5h8/muslims-reading-from-quran-53876-20958.webp",
    "https://i.postimg.cc/x1Fc92jT/blue-mosque-istanbul-1157-8841.webp",
    "https://i.postimg.cc/j5y56nHL/muhammad-ali-pasha-cairo-219717-5352.webp",
    "https://i.postimg.cc/dVWyHfhr/images-1-21.jpg",
    "https://i.postimg.cc/q7MGgn3X/images-1-22.jpg",
    "https://i.postimg.cc/sX5CXtSh/images-1-16.jpg",
    "https://i.postimg.cc/66Rp2Pwz/images-1-17.jpg",
    "https://i.postimg.cc/Qtzh9pY2/images-1-18.jpg",
    "https://i.postimg.cc/MGrhdz0R/images-1-19.jpg",
    "https://i.postimg.cc/LsMSj9Ts/images-1-20.jpg",
    "https://i.postimg.cc/KzNXyttX/images-1-13.jpg"
  ];

  // Pick random caption and image
  const caption = captions[Math.floor(Math.random() * captions.length)];
  const imgURL = images[Math.floor(Math.random() * images.length)];

  // Prepare paths
  const cacheDir = path.join(__dirname, 'cache');
  const fileName = `islm_pic_${Date.now()}.jpg`;
  const filePath = path.join(cacheDir, fileName);

  // Ensure cache dir exists
  try {
    if (fs.mkdirSync) { // works for both fs and fs-extra
      if (!(fs.existsSync && fs.existsSync(cacheDir))) {
        try { fs.mkdirSync(cacheDir, { recursive: true }); } catch (e) { /* ignore */ }
      }
    }
  } catch (e) {
    // ignore
  }

  let wroteFile = false;
  try {
    // Download image as stream
    const res = await axios({
      method: 'GET',
      url: encodeURI(imgURL),
      responseType: 'stream',
      timeout: 15000
    });

    if (!res || !res.data) {
      throw new Error('Image download failed (no data).');
    }

    // Pipe stream to file
    const stream = res.data;
    const writer = fs.createWriteStream(filePath);
    await new Promise((resolve, reject) => {
      stream.pipe(writer);
      let error = null;
      stream.on('error', err => { error = err; try { writer.close(); } catch (e) {} ; reject(err); });
      writer.on('error', err => { error = err; try { writer.close(); } catch (e) {} ; reject(err); });
      writer.on('finish', () => { if (!error) resolve(); else reject(error); });
    });

    wroteFile = true;

    // Send message (with attachment)
    await api.sendMessage({
      body: `✨ Islamic Caption ✨\n\n${caption}`,
      attachment: fs.createReadStream(filePath)
    }, event.threadID);

  } catch (err) {
    console.error('islm command error:', err && (err.stack || err.message || err));
    try { await api.sendMessage('⚠️ কিছু সমস্যা হয়েছে, অনুগ্রহ করে পরে আবার চেষ্টা করুন।', event.threadID); } catch (e) {}
  } finally {
    // Cleanup downloaded file
    if (wroteFile) safeUnlink(filePath);
  }
};
