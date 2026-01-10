const axios = require("axios");

module.exports = {
  config: {
    name: "bot",
    version: "2.1.0",
    permission: 0,
    credits: "shourov (fixed)",
    prefix: true, // /bot
    description: "Talk with bot (no prefix + reply + sim api)",
    category: "talk",
    usages: "bot",
    cooldowns: 3
  },

  // =================================================
  // 🔥 NO PREFIX → শুধু "bot" লিখলে trigger
  // =================================================
  handleEvent: async function ({ api, event, Users }) {
    try {
      if (!event.body) return;

      // ❌ bot নিজের message ignore করবে
      if (event.senderID === api.getCurrentUserID()) return;

      const body = event.body.trim().toLowerCase();
      if (body !== "bot") return;

      const name = await Users.getNameUser(event.senderID);

      const replies = [
        "বলো জান 😌",
        "কি জানতে চাও 🖤",
        "আমি শুনছি 😇",
        "হ্যাঁ বলো 😊"
      ];

      const msg = replies[Math.floor(Math.random() * replies.length)];

      return api.sendMessage(
        `🤖 ${name}, ${msg}`,
        event.threadID,
        (err, info) => {
          if (!global.client.handleReply) global.client.handleReply = [];

          global.client.handleReply.push({
            name: this.config.name,
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

  // =================================================
  // 🔹 PREFIX → /bot hi
  // =================================================
  run: async function ({ api, event, args, Users }) {
    try {
      // ❌ bot নিজের message ignore
      if (event.senderID === api.getCurrentUserID()) return;

      const msg = args.join(" ").trim();

      // শুধু /bot
      if (!msg) {
        const name = await Users.getNameUser(event.senderID);
        return api.sendMessage(
          `🤖 ${name}, বলো জান 😌`,
          event.threadID,
          event.messageID
        );
      }

      // ===== API LOAD =====
      const apiJson = await axios.get(
        "https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json"
      );

      const simApi = apiJson.data.sim;
      const fontApi = apiJson.data.api2;

      // ===== SIM REPLY =====
      const res = await axios.get(
        `${simApi}/sim?type=ask&ask=${encodeURIComponent(msg)}`
      );

      let reply = res.data?.data?.msg || "😅 বুঝতে পারিনি";

      // ===== FONT STYLE =====
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
          if (!global.client.handleReply) global.client.handleReply = [];

          global.client.handleReply.push({
            name: this.config.name,
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

  // =================================================
  // 🔁 REPLY HANDLE (bot message এ reply দিলে)
  // =================================================
  handleReply: async function ({ api, event }) {
    try {
      if (!event.body) return;

      // ❌ bot নিজের message ignore
      if (event.senderID === api.getCurrentUserID()) return;

      const apiJson = await axios.get(
        "https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json"
      );

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

      return api.sendMessage(reply, event.threadID, event.messageID);

    } catch (e) {
      console.error("[bot handleReply]", e);
    }
  }
};