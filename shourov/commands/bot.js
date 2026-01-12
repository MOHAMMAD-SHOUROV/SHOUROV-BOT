const axios = require('axios');
const fs = require('fs'); 
const path = require('path');

module.exports = {
  config: {
    name: "bot",
    version: "1.0.0",
    aliases: ["mim"],
    permission: 0,
    credits: "nayan",
    description: "talk with bot",
    prefix: false,
    category: "talk",
    usages: "Bot [message]",
    cooldowns: 5,
  },

  // 🔁 reply handler (API #1 stays same)
  handleReply: async function ({ api, event }) {
    try {
      if (!event.body) return;

      // ✅ only reply if message starts with "bot"
      if (!event.body.toLowerCase().startsWith("bot")) return;

      const apiData = await axios.get(
        'https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json'
      );
      const apiUrl = apiData.data.sim;

      const kl = await axios.get(
        'https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json'
      );
      const apiUrl2 = kl.data.api2;

      const question = event.body.replace(/^bot/i, "").trim();
      if (!question) return;

      const response = await axios.get(
        `${apiUrl}/sim?type=ask&ask=${encodeURIComponent(question)}`
      );

      const result = response.data.data.msg;

      const textStyles = loadTextStyles();
      const userStyle = textStyles[event.threadID]?.style || 'normal';

      const fontResponse = await axios.get(
        `${apiUrl2}/bold?text=${encodeURIComponent(result)}&type=${userStyle}`
      );

      const text = fontResponse.data.data.bolded;

      api.sendMessage(text, event.threadID, (err, info) => {
        if (!err) {
          global.client.handleReply.push({
            type: 'reply',
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            head: question
          });
        }
      }, event.messageID);

    } catch (e) {
      console.error("handleReply error:", e);
    }
  },

  // ▶️ main entry (API #2 stays same)
  start: async function ({ nayan, events, args, Users }) {
    try {
      if (!events.body) return;

      // ✅ only trigger if message starts with "bot"
      if (!events.body.toLowerCase().startsWith("bot")) return;

      const msg = events.body.replace(/^bot/i, "").trim();

      const apiData = await axios.get(
        'https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json'
      );
      const apiUrl = apiData.data.sim;

      // greeting
      if (!msg) {
        const name = await Users.getNameUser(events.senderID);
        return nayan.reply({
          body: `${name}, বলো 😊 আমি শুনছি`,
          mentions: [{ tag: name, id: events.senderID }]
        }, events.threadID, events.messageID);
      }

      // normal ask (API #3 stays same)
      const response = await axios.get(
        `${apiUrl}/sim?type=ask&ask=${encodeURIComponent(msg)}`
      );

      const replyMessage = response.data.data.msg;

      const kl = await axios.get(
        'https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json'
      );
      const apiUrl2 = kl.data.api2;

      const font = await axios.get(
        `${apiUrl2}/bold?text=${encodeURIComponent(replyMessage)}&type=normal`
      );

      const styledText = font.data.data.bolded;

      nayan.reply({ body: styledText }, events.threadID);

    } catch (err) {
      console.error("start error:", err);
    }
  }
};

// ---------- helpers (unchanged) ----------

function loadTextStyles() {
  const filePath = path.join(__dirname, 'system', 'textStyles.json');
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
  }
  return JSON.parse(fs.readFileSync(filePath));
}