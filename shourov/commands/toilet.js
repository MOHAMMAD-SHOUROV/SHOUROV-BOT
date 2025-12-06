// উপরের অংশ যথারীতি config...

module.exports.run = async ({ event, api, args, Users }) => {
  const fs = require('fs-extra');
  const axios = require('axios');
  const Canvas = require('canvas');
  const jimp = require('jimp');

  const cacheDir = __dirname + '/cache';
  await fs.ensureDir(cacheDir);
  const path_toilet = cacheDir + '/toilet.png';

  try {
    const mentionIDs = Object.keys(event.mentions || {});
    const targetID = mentionIDs.length ? mentionIDs[0] : event.senderID;

    // background: বাড়তি নিরাপদ পদ্ধতি - axios থেকে buffer নাও
    const bgURL = 'https://i.imgur.com/Kn7KpAr.jpg';
    const bgRes = await axios.get(bgURL, { responseType: 'arraybuffer' });
    const bgBuffer = Buffer.from(bgRes.data, 'binary');

    // avatar fetch (facebook public)
    const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512`;
    const avRes = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
    const avBuffer = Buffer.from(avRes.data, 'binary');

    // circle with jimp
    const img = await jimp.read(avBuffer);
    img.circle();
    const circularBuffer = await img.getBufferAsync(jimp.MIME_PNG);

    // create canvas
    const bgImage = await Canvas.loadImage(bgBuffer);
    const avaImage = await Canvas.loadImage(circularBuffer);
    const canvas = Canvas.createCanvas(500, 670);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bgImage, 0, 0, 500, 670);
    ctx.drawImage(avaImage, 135, 350, 205, 205);

    const outBuffer = canvas.toBuffer('image/png');
    await fs.writeFile(path_toilet, outBuffer);

    // send
    await api.sendMessage({
      body: "🐸🐸",
      attachment: fs.createReadStream(path_toilet)
    }, event.threadID);

    // cleanup
    await fs.remove(path_toilet);
  } catch (err) {
    console.error("TOILET ERR:", err);
    // reply user-friendly
    return api.sendMessage("সার্ভারে সমস্যা: " + (err.message || err), event.threadID);
  }
};
