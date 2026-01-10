const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "bot",
    version: "2.0.0",
    permission: 0,
    credits: "shourov",
    prefix: true,          // /bot কাজ করবে
    description: "Talk with bot (no prefix + prefix + sim api)",
    category: "talk",
    usages: "bot",
    cooldowns: 3
  },

  // =================================================
  // 🔥 NO PREFIX → শুধু "bot" লিখলেই trigger
  // =================================================
  handleEvent: async function ({ api, event, Users }) {
    try {
      if (!event.body) return;

      const body = event.body.trim().toLowerCase();
      if (body !== "bot") return;

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

      // ===== SIM API =====
      const apiJson = await axios.get(
        "https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json"
      );

      const simApi = apiJson.data.sim;
      const fontApi = apiJson.data.api2;

      const res = await axios.get(
        `${simApi}/sim?type=ask&ask=${encodeURIComponent(msg)}`
      );

      let reply = res.data?.data?.msg || "কিছু বুঝতে পারিনি 😅";

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
          if (!global.client) global.client = {};
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
  // 🔁 REPLY HANDLE (bot এর message এ reply দিলে)
  // =================================================
  handleReply: async function ({ api, event }) {
    try {
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