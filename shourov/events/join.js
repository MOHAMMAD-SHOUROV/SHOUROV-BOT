module.exports.config = {
  name: "join",
  eventType: ['log:subscribe'],
  version: "1.0.0",
  credits: "// FIXED BY YAN shourov",
  description: "GROUP UPDATE NOTIFICATION"
};

const fs = require('fs-extra');
const { loadImage, createCanvas, registerFont } = require("canvas");
const request = require('request');
const axios = require('axios');
const jimp = require("jimp");
const moment = require("moment-timezone");

module.exports.circle = async (image) => {
  image = await jimp.read(image);
  image.circle();
  return await image.getBufferAsync("image/png");
};

module.exports.run = async function({ api, event, Users }) {
  try {
    const threadID = event.threadID;
    const time = moment.tz("Asia/Dhaka").format("HH:mm:ss - DD/MM/YYYY");
    const thu = moment.tz("Asia/Dhaka").format("dddd");

    let threadInfo = await api.getThreadInfo(threadID);
    let threadName = threadInfo.threadName;

    // bot join হলে message
    if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {

      let gifUrl = 'https://i.postimg.cc/Kj8stktZ/flamingtext-com-2578872570.gif';
      let gifPath = __dirname + '/shourov/join/join.gif';

      let gifData = (await axios.get(gifUrl, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(gifPath, gifData);

      api.changeNickname(`[ ${global.config.PREFIX} ] • ${global.config.BOTNAME}`, threadID, api.getCurrentUserID());

      return api.sendMessage(
        {
          body: `BOT CONNECTED SUCCESSFULLY! 🤖✨

Assalamualaikum ☘️  
Use: ${global.config.PREFIX}help  
Command Example:
${global.config.PREFIX}admin  
${global.config.PREFIX}islam  
${global.config.PREFIX}fbvideo  

Developer: KING SHOUROV  
Facebook: https://www.facebook.com/www.xsxx.com365
WhatsApp: wa.me/+8801709281334`,
          attachment: fs.createReadStream(gifPath)
        },
        threadID
      );
    }

    // New member join হলে image তৈরি
    let attachments = [];
    let names = [];

    for (let member of event.logMessageData.addedParticipants) {
      let userID = member.userFbId;
      let userName = member.fullName;
      names.push(userName);

      let avatarBuffer = (
        await axios.get(
          `https://graph.facebook.com/${userID}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        )
      ).data;

      let backgrounds = [
        'https://i.imgur.com/WKUqCkQ.jpeg',
        'https://i.imgur.com/ccVuwrA.jpeg',
        'https://i.imgur.com/ZPGBaPD.jpeg',
        'https://i.imgur.com/las7yGW.jpeg',
        'https://i.imgur.com/bxDnRQC.jpeg'
      ];

      let bgBuffer = (
        await axios.get(backgrounds[Math.floor(Math.random() * backgrounds.length)], {
          responseType: "arraybuffer"
        })
      ).data;

      let circleAvatar = await this.circle(avatarBuffer);

      let canvas = createCanvas(1900, 1080);
      let ctx = canvas.getContext("2d");

      let bgImage = await loadImage(bgBuffer);
      let avImage = await loadImage(circleAvatar);

      ctx.drawImage(bgImage, 0, 0, 1900, 1080);

      registerFont(__dirname + `/shourov/font/Semi.ttf`, { family: "Semi" });

      ctx.drawImage(avImage, 760, 120, 380, 380);

      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";

      ctx.font = "120px Semi";
      ctx.fillText(userName, 950, 600);

      ctx.font = "60px Semi";
      ctx.fillText(`Welcome to ${threadName}`, 950, 700);

      let imagePath = __dirname + `/shourov/join/${userID}.png`;
      fs.writeFileSync(imagePath, canvas.toBuffer());
      attachments.push(fs.createReadStream(imagePath));
    }

    let msg = `╭•┄┅══❁🌺❁══┅┄•╮
      আসসালামু আলাইকুম 🖤
╰•┄┅══❁🌺❁══┅┄•╯

✨ নতুন সদস্য যোগ দিয়েছেন!
👤 সদস্য: ${names.join(", ")}

📌 সময়: ${time}
📌 দিন: ${thu}

🌺 স্বাগতম আমাদের গ্রুপে 🌺`;

    return api.sendMessage(
      {
        body: msg,
        attachment: attachments
      },
      threadID
    );

  } catch (err) {
    console.log("JOIN ERROR:", err);
  }
};
