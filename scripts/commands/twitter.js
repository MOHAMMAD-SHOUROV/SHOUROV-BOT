module.exports.config = {
  name: "twitter",
  version: "2.0.0",
  permission: 0,
  credits: "Shourov",
  description: "Download video from Twitter",
  prefix: true,
  category: "admin",
  usages: "link",
  cooldowns: 5,
  dependencies: {
        'image-downloader': ''
  }
};
module.exports.run = async function({ api, event, args }) {
  
  api.setMessageReaction("😘", event.messageID, (err) => {
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
  if (!args[1]) api.sendMessage(`𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐈𝐍𝐆 𝐕𝐈𝐃𝐄𝐎 𝐅𝐎𝐑 𝐘𝐎𝐔\n\n𝐏𝐋𝐄𝐀𝐒𝐄 𝐖𝟖...`, event.threadID, (err, info) => setTimeout(() => { api.unsendMessage(info.messageID) }, 20000));

 try {
   const res = await twitterdown(`${content}`);
console.log(res)
   var file = fs.createWriteStream(__dirname + '/cache/tw.mp4');
   
        const n = res.data.HD;
        const rqs = request(encodeURI(n));
   
    

  rqs.pipe(file);  
  file.on('finish', () => {
    
    setTimeout(function() {
      
      return api.sendMessage({
        body: `🔰𝗔𝗣𝗜 𝗕𝗬 𝗠𝗢𝗛𝗔𝗠𝗠𝗔𝗗 𝗡𝗔𝗬𝗔𝗡`,
        attachment: fs.createReadStream(__dirname + '/cache/tw.mp4')
      }, threadID, messageID)
    }, 5000)
  })
    } catch (err) {
    api.sendMessage(`error`, event.threadID, event.messageID);  
   }
};
