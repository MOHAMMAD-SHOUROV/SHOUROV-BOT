const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "bot",
    version: "1.0.1",
    aliases: ["mim"],
    permission: 0,
    credits: "nayan (fixed by shourov)",
    description: "talk with bot",
    prefix: true,
    category: "talk",
    usages: "hi",
    cooldowns: 5
  },

  // ================= HANDLE REPLY =================
  handleReply: async function ({ api, event }) {
    try {
      const apiData = await axios.get("https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json");
      const apiUrl = apiData.data.sim;
      const apiUrl2 = apiData.data.api2;

      const response = await axios.get(
        `${apiUrl}/sim?type=ask&ask=${encodeURIComponent(event.body)}`
      );

      const result = response.data.data.msg || "🙂";

      const styles = loadTextStyles();
      const userStyle = styles[event.threadID]?.style || "normal";

      const fontResponse = await axios.get(
        `${apiUrl2}/bold?text=${encodeURIComponent(result)}&type=${userStyle}`
      );

      const text = fontResponse.data.data.bolded;

      api.sendMessage(text, event.threadID, (err, info) => {
        if (!err) {
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID
          });
        }
      }, event.messageID);

    } catch (e) {
      console.error("handleReply error:", e);
    }
  },

  // ================= RUN COMMAND =================
  run: async function ({ api, event, args, Users }) {
    try {
      const msg = args.join(" ");
      const apiData = await axios.get("https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json");
      const apiUrl = apiData.data.sim;
      const apiUrl2 = apiData.data.api2;

      // ---- NO MESSAGE ----
      if (!msg) {
        const greetings = [
          "আহ শুনা আমার তোমার অলিতে গলিতে উম্মাহ 😘",
          "কি গো সোনা আমাকে ডাকছ কেনো",
          "আসসালামু আলাইকুম 😊",
          "আমাকে এত না ডেকে বস সৌরভকে একটা গফ দে 😒"
        ];

        const name = await Users.getNameUser(event.senderID);
        const rand = greetings[Math.floor(Math.random() * greetings.length)];

        return api.sendMessage(
          {
            body: `${name}, ${rand}`,
            mentions: [{ tag: name, id: event.senderID }]
          },
          event.threadID,
          (err, info) => {
            if (!err) {
              global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: event.senderID
              });
            }
          },
          event.messageID
        );
      }

      // ---- TEXT TYPE ----
      if (msg.startsWith("textType")) {
        const type = msg.split(" ")[1];
        const allow = ["serif", "sans", "italic", "italic-sans", "medieval", "normal"];

        if (!allow.includes(type)) {
          return api.sendMessage(
            `Invalid type!\nUse: ${allow.join(", ")}`,
            event.threadID,
            event.messageID
          );
        }

        saveTextStyle(event.threadID, type);
        return api.sendMessage(
          `✅ Text style set to ${type}`,
          event.threadID,
          event.messageID
        );
      }

      // ---- NORMAL CHAT ----
      const response = await axios.get(
        `${apiUrl}/sim?type=ask&ask=${encodeURIComponent(msg)}`
      );

      let reply = response.data.data.msg || "🙂";

      const styles = loadTextStyles();
      const userStyle = styles[event.threadID]?.style || "normal";

      const font = await axios.get(
        `${apiUrl2}/bold?text=${encodeURIComponent(reply)}&type=${userStyle}`
      );

      reply = font.data.data.bolded;

      api.sendMessage(reply, event.threadID, (err, info) => {
        if (!err) {
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID
          });
        }
      }, event.messageID);

    } catch (e) {
      console.error("bot run error:", e);
      api.sendMessage("❌ সমস্যা হয়েছে, পরে আবার চেষ্টা করুন", event.threadID);
    }
  }
};

// ================= TEXT STYLE SYSTEM =================
function loadTextStyles() {
  const p = path.join(__dirname, "textStyles.json");
  if (!fs.existsSync(p)) fs.writeFileSync(p, "{}");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function saveTextStyle(threadID, style) {
  const p = path.join(__dirname, "textStyles.json");
  const data = loadTextStyles();
  data[threadID] = { style };
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}