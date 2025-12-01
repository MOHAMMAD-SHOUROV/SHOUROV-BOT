/** Respect the credits — Edited & Styled by your request **/
module.exports.config = {
  name: `${global.config.PREFIX}`,
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
  const axios = global.nodemodule["axios"];
  const request = global.nodemodule["request"];
  const fs = global.nodemodule["fs-extra"];

  // ─── Caption List ─────────────────────────────────────
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

  // ─── Image List ─────────────────────────────────────
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

  // Pick Random
  const caption = captions[Math.floor(Math.random() * captions.length)];
  const imgURL = images[Math.floor(Math.random() * images.length)];

  // Download + Send
  const filePath = __dirname + "/cache/islm_pic.jpg";

  request(encodeURI(imgURL))
    .pipe(fs.createWriteStream(filePath))
    .on("close", () => {
      api.sendMessage(
        {
          body: `✨ Islamic Caption ✨\n\n${caption}`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlinkSync(filePath)
      );
    });
};
