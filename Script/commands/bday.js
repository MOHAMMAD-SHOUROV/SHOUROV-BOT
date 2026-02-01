module.exports.config = {
  name: "bday",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Admin birthday",
  usePrefix: false,
  commandCategory: "bday",
  cooldowns: 5
};

const BIRTHDAY = "16/12";

module.exports.run = async ({ api, event }) => {
  const axios = global.nodemodule["axios"];
  const fs = global.nodemodule["fs-extra"];
  const path = __dirname + "/cache/bday.png";

  const now = new Date();

  const [day, month] = BIRTHDAY.split("/").map(Number);

  let year = now.getFullYear();
  let targetDate = new Date(year, month - 1, day, 0, 0, 0);

  if (now > targetDate) {
    targetDate.setFullYear(year + 1);
  }

  const diffMs = targetDate - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const diffSeconds = Math.floor((diffMs / 1000) % 60);

  if (diffDays === 1) {
    const tomorrowMessage = `👉 Admin SHAHADAT SAHU এর জন্মদিন আগামীকাল!
অবশেষে এডমিনের জন্মদিন ফাঁস হয়ে গেল 😜

উইশ করতে ভুলবে না কিন্তু... 🥰`;
    return api.sendMessage(tomorrowMessage, event.threadID, event.messageID);
  }

  if (diffDays === 0) {
    const happyBirthdayMessage = `╔═══ 🎉 HAPPY BIRTHDAY 🎉 ═══╗
║ OUR BOSS - SHAHADAT SAHU 💖
╟──────────────────────
║ 🎂 আজ আমাদের Boss এর জন্মদিন!
║ 🥳 সবাই মন থেকে উইশ করো
║ ❤️ দোয়া ও ভালোবাসা জানাও
╟──────────────────────
║ 📘 Facebook :
║ www.facebook.com/100044713412032
║ 💬 Messenger :
║ m.me/100044713412032
║ 📱 WhatsApp :
║ https://wa.me/+8801882333052
╚══════════════════════╝`;
    return api.sendMessage(happyBirthdayMessage, event.threadID, event.messageID);
  }

  const countdownMessage = `╔═══════════════════╗
║ 🎂 Admin SHAHADAT SAHU
║ জন্মদিন কাউন্টডাউন ❤️‍🔥
║═══════════════════
║ 📅 Days : ${diffDays}
║ ⏰ Hours : ${diffHours}
║ 🕰️ Minutes : ${diffMinutes}
║ ⏳ Seconds : ${diffSeconds}
╚════════════════════╝`;

  const url = "https://graph.facebook.com/100044713412032/picture?height=720&width=720";

  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream"
    });

    const writer = fs.createWriteStream(path);
    response.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage(
        {
          body: countdownMessage,
          attachment: fs.createReadStream(path)
        },
        event.threadID,
        () => fs.unlinkSync(path)
      );
    });

    writer.on("error", () => {
      api.sendMessage("❌ Image download failed.", event.threadID, event.messageID);
    });

  } catch (err) {
    api.sendMessage("❌ Error occurred while getting image.", event.threadID, event.messageID);
  }
};
