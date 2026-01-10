const axios = require("axios");

const API_JSON =
  "https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json";

module.exports = {
  config: {
    name: "bot",
    version: "2.1.0",
    permission: 0,
    credits: "shourov",
    prefix: true,
    description: "Talk with bot (no prefix + prefix + reply)",
    category: "talk",
    usages: "bot",
    cooldowns: 3
  },

  // ================= NO PREFIX =================
  handleEvent: async function ({ api, event, Users }) {
    try {
      if (!event.body) return;
      if (event.body.trim().toLowerCase() !== "bot") return;

      const name = await Users.getNameUser(event.senderID);

      const greetings = [
        "হুম জান বলো 😌",
        "কি গো ডাকছো কেন 🥱",
        "আমি এখানে বলো 🖤",
        "হ্যাঁ শুনছি 😇"
      ];

      const msg = greetings[Math.floor(Math.random() * greetings.length)];

      return api.sendMessage(
        `🤖 ${name}, ${msg}`,
        event.threadID,
        (err, info) => {
          if (!global.client) global.client = {};
          if (!global.client.handleReply) global.client.handleReply = [];

          global.client.handleReply.push({
            name: "bot",
            messageID: info.messageID,
            author: event.senderID
          });
        },
        event.messageID
      );
    } catch (e) {
      console.error("[bot handleEvent]", e);
    }
  },

  // ================= PREFIX =================
  run: async function ({ api, event, args }) {
    try {
      const msg = args.join(" ").trim();

      if (!msg)
        return api.sendMessage(
          "🤖 বলো জান 😌",
          event.threadID,
          event.messageID
        );

      const apiJson = await axios.get(API_JSON);
      const simApi = apiJson.data.sim;
      const fontApi = apiJson.data.api2;

      const res = await axios.get(
        `${simApi}/sim?type=ask&ask=${encodeURIComponent(msg)}`
      );

      let reply = res.data?.data?.msg || "🙂";

      try {
        const styled = await axios.get(
          `${fontApi}/bold?text=${encodeURIComponent(reply)}&type=normal`
        );
        reply = styled.data?.data?.bolded || reply;
      } catch {}

      return api.sendMessage(
        reply,
        event.threadID,
        (err, info) => {
          if (!global.client) global.client = {};
          if (!global.client.handleReply) global.client.handleReply = [];

          global.client.handleReply.push({
            name: "bot",
            messageID: info.messageID,
            author: event.senderID
          });
        },
        event.messageID
      );
    } catch (e) {
      console.error("[bot run]", e);
      return api.sendMessage(
        "❌ এখন কথা বলতে পারছি না",
        event.threadID,
        event.messageID
      );
    }
  },

  // ================= REPLY =================
  handleReply: async function ({ api, event, handleReply }) {
    try {
      // ❗ শুধু যিনি শুরু করেছে, সে reply দিতে পারবে
      if (event.senderID !== handleReply.author) return;

      const apiJson = await axios.get(API_JSON);
      const simApi = apiJson.data.sim;
      const fontApi = apiJson.data.api2;

      const res = await axios.get(
        `${simApi}/sim?type=ask&ask=${encodeURIComponent(event.body)}`
      );

      let reply = res.data?.data?.msg || "🙂";

      try {
        const styled = await axios.get(
          `${fontApi}/bold?text=${encodeURIComponent(reply)}&type=normal`
        );
        reply = styled.data?.data?.bolded || reply;
      } catch {}

      return api.sendMessage(
        reply,
        event.threadID,
        event.messageID
      );
    } catch (e) {
      console.error("[bot handleReply]", e);
    }
  }
};