module.exports.config = {
    name: "info",
    version: "1.0.1",
    permission: 0,
    credits: "Shourov",
    prefix: true,
    description: "Show owner information",
    category: "user",
    usages: "/info",
    cooldowns: 5
};

module.exports.run = async function({ api, event }) {

    const fs = global.nodemodule["fs-extra"];
    const request = global.nodemodule["request"];

    const imgPath = __dirname + "/cache/info_owner.png";

    // Download Owner Profile Picture
    const avatarURL =
      "https://graph.facebook.com/100071971474157/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

    request(encodeURI(avatarURL))
      .pipe(fs.createWriteStream(imgPath))
      .on("close", () => {
        const infoMessage = `
╔════•| ✦ |•════╗
   🔥 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎  
╚════•| ✦ |•════╝

👑 𝐍𝐚𝐦𝐞 : 𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕
📘 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 : AlIHSAN SHOUROV
🕌 𝐑𝐞𝐥𝐢𝐠𝐢𝐨𝐧 : Islam

🏡 𝐇𝐨𝐦𝐞𝐭𝐨𝐰𝐧 : Debiganj, Panchagarh
📍 𝐂𝐮𝐫𝐫𝐞𝐧𝐭 : Debiganj, Panchagarh

🚹 𝐆𝐞𝐧𝐝𝐞𝐫 : Male
🎂 𝐀𝐠𝐞 : 18+
❤️ 𝐑𝐞𝐥𝐚𝐭𝐢𝐨𝐧𝐬𝐡𝐢𝐩 : Single

🎓 𝐎𝐜𝐜𝐮𝐩𝐚𝐭𝐢𝐨𝐧 : Student

✉️ 𝐆𝐦𝐚𝐢𝐥 : shourovislam5430@gmail.com
📞 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 : wa.me/+8801709281334
📨 𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦 : t.me/shourov_ss

🌐 𝐅𝐁 𝐋𝐢𝐧𝐤 :
https://www.facebook.com/shourov.sm24
`;

        api.sendMessage(
          {
            body: infoMessage,
            attachment: fs.createReadStream(imgPath)
          },
          event.threadID,
          () => fs.unlinkSync(imgPath)
        );
      });
};