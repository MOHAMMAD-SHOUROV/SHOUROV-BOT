
module.exports.config = {
  name: "tikmp3",
  version: "2.0.0",
  permission: 0,
  credits: "Shourov",
  description: "Download video from facebook",
  prefix: true,
  category: "admin",
  usages: "link",
  cooldowns: 5,
  dependencies: {
        'image-downloader': '',
  }
};
module.exports.run = async function({ api, event, args }) {

  api.setMessageReaction("✅", event.messageID, (err) => {
  }, true);
  api.sendTypingIndicator(event.threadID, true);

  const { messageID, threadID } = event;
  const { nayan } = global.apiShourov;
  const fs = require("fs");
  const axios = require("axios");
  const request = require("request");
  const { ytdown, ndown, tikdown, twitterdown } = require("nayan-video-downloader")
  const prompt = args.join(" ");
  if (!args[0]) return api.sendMessage("[ ! ] Input link.", threadID, messageID);

  const content = args.join(" ");
  if (!args[1]) api.sendMessage(`𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐈𝐍𝐆 𝗔𝗨𝗗𝗜𝗢 𝐅𝐎𝐑 𝐘𝐎𝐔\n\n𝐏𝐋𝐄𝐀𝐒𝐄 𝐖𝟖...`, event.threadID, (err, info) => setTimeout(() => { api.unsendMessage(info.messageID) }, 10000));

 try {
  const res = await tikdown(`${content}`);
console.log(res)
   var file = fs.createWriteStream(__dirname + '/cache/tik.mp3');

        const { audio, title, duration, author } = res.data;
        const rqs = request(encodeURI(`${audio}`));



  rqs.pipe(file);  
  file.on('finish', () => {

    setTimeout(function() {

      return api.sendMessage({
        body: `==[ 𝐌𝐔𝐒𝐈𝐂 𝐓𝐈𝐊𝐓𝐎𝐊 ]====\n━━━━━━━━━━━━━━\n\n💬 𝗧𝗶𝘁𝗹𝗲 𝗮𝘂𝗱𝗶𝗼: ${title}\n✒ 𝐍𝐈𝐂𝐊𝐍𝐀𝐍𝐄: ${author.nickname}\n⏱ 𝐓𝐢𝐦𝐞: ${duration} second\n\n⇆ㅤ ㅤ◁ㅤ ❚❚ ㅤ▷ ㅤㅤ↻`,
        attachment: fs.createReadStream(__dirname + '/cache/tik.mp3')
      }, threadID, messageID)
    }, 5000)
  })
    } catch (err) {
    api.sendMessage(`error`, event.threadID, event.messageID);  
   }
};
