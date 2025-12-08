module.exports.config = {
  name: "mia",
  version: "1.0.1",
  permission: 0,
  credits: "shourov",
  description: "example — write text on image",
  prefix: true,
  category: "Love",
  usages: "text",
  cooldowns: 5,
};

module.exports.wrapText = (ctx, text, maxWidth) => {
  return new Promise(resolve => {
    if (!text) return resolve([]);
    if (ctx.measureText(text).width < maxWidth) return resolve([text]);
    if (ctx.measureText('W').width > maxWidth) return resolve(null);

    const words = text.split(' ');
    const lines = [];
    let line = '';

    while (words.length > 0) {
      let split = false;
      while (ctx.measureText(words[0]).width >= maxWidth) {
        const temp = words[0];
        words[0] = temp.slice(0, -1);
        if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
        else {
          split = true;
          words.splice(1, 0, temp.slice(-1));
        }
      }
      if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) {
        line += `${words.shift()} `;
      } else {
        lines.push(line.trim());
        line = '';
      }
      if (words.length === 0) {
        if (line) lines.push(line.trim());
      }
    }
    return resolve(lines);
  });
};

module.exports.run = async function({ api, event, args }) {
  let { senderID, threadID, messageID } = event;
  const { loadImage, createCanvas } = require("canvas");
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  const path = __dirname + '/cache';

  if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });

  let pathImg = path + '/mia_output.png';
  const text = args.join(" ").trim();
  if (!text) return api.sendMessage("Enter the content of the comment on the board", threadID, messageID);

  try {
    // fetch background image
    const resp = await axios.get(`https://i.postimg.cc/Jh86TFLn/Pics-Art-08-14-10-45-31.jpg`, { responseType: 'arraybuffer' });
    fs.writeFileSync(pathImg, Buffer.from(resp.data, 'utf-8'));

    // load and draw
    const baseImage = await loadImage(pathImg);
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    // initial font setup
    let fontSize = 45; // starting sensible size
    ctx.textBaseline = "top";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "start";

    // adapt font size so long single-line text won't overflow allowed area
    // we'll target a max width for the block of text (for example 1160 as you used)
    const maxBlockWidth = 1160;
    ctx.font = `${fontSize}px Arial`;
    // if the text is extremely long shrink font down until the longest line fits roughly canvas
    while (ctx.measureText(text).width > (maxBlockWidth * 2) && fontSize > 10) {
      fontSize--;
      ctx.font = `${fontSize}px Arial`;
    }

    // obtain wrapped lines using the helper
    ctx.font = `${fontSize}px Arial`;
    const lines = await this.wrapText(ctx, text, maxBlockWidth) || [text];

    // compute line height and starting coords
    const lineHeight = Math.floor(fontSize * 1.2);
    // starting X,Y — you used (60,165) previously; keep those but ensure lines don't overflow canvas height
    const startX = 60;
    const startY = 165;

    // if block would overflow bottom, try to reduce font size a bit
    let totalHeight = lines.length * lineHeight;
    while (startY + totalHeight > canvas.height - 20 && fontSize > 10) {
      fontSize--;
      ctx.font = `${fontSize}px Arial`;
      // re-wrap at smaller font
      const wrapped = await this.wrapText(ctx, text, maxBlockWidth) || [text];
      lines.length = 0;
      wrapped.forEach(l => lines.push(l));
      totalHeight = lines.length * Math.floor(fontSize * 1.2);
    }

    // final font set
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = "#000000";

    // draw each line
    for (let i = 0; i < lines.length; i++) {
      const y = startY + i * lineHeight;
      ctx.fillText(lines[i], startX, y);
    }

    // write out and send
    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);

    return api.sendMessage(
      { attachment: fs.createReadStream(pathImg) },
      threadID,
      () => {
        try { if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg); } catch(e){ }
      },
      messageID
    );
  } catch (err) {
    console.error("mia command error:", err);
    try { if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg); } catch(e){ }
    return api.sendMessage("An error occurred while creating the image.", threadID, messageID);
  }
};