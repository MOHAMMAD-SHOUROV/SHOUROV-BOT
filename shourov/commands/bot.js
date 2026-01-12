const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "bot",
    version: "3.0.0",
    permission: 0,
    credits: "nayan | fixed by shourov",
    description: "Auto reply when message starts with Bot",
    prefix: false,
    category: "talk",
    usages: "Bot <message>",
    cooldowns: 3
  },

  // ===============================
  // ✅ AUTO REPLY (NO PREFIX)
  // ===============================
  handleEvent: async function ({ api, event, Users }) {
    try {
      if (!event.body) return;
      if (event.senderID === api.getCurrentUserID()) return;

      const body = event.body.trim();

      // ❌ must START with "bot"
      if (!body.toLowerCase().startsWith("bot")) return;

      // remove "bot" from beginning
      const question = body.replace(/^bot/i, "").trim() || "হাই";

      // ===============================
      // 🔹 API (1)
      // ===============================
      const apiJson = await axios.get(
        "https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json"
      );

      const simApi = apiJson.data.sim;
      const fontApi = apiJson.data.api2;

      // ===============================
      // 🔹 API (2)
      // ===============================
      const res = await axios.get(
        `${simApi}/sim?type=ask&ask=${encodeURIComponent(question)}`
      );

      let reply = res.data?.data?.msg || "🙂 বুঝতে পারিনি";

      // ===============================
      // 🔹 API (3)
      // ===============================
      try {
        const styled = await axios.get(
          `${fontApi}/bold?text=${encodeURIComponent(reply)}&type=normal`
        );
        reply = styled.data.data.bolded;
      } catch {}

      // ===============================
      // SEND MESSAGE
      // ===============================
      return api.sendMessage(
        reply,
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

    } catch (err) {
      console.error("❌ bot handleEvent error:", err);
    }
  },

  // ===============================
  // 🔁 REPLY SUPPORT
  // ===============================
  handleReply: async function ({ api, event, handleReply }) {
    try {
      if (event.senderID !== handleReply.author) return;

      // ===============================
      // 🔹 API (4)
      // ===============================
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
        reply = styled.data.data.bolded;
      } catch {}

      return api.sendMessage(reply, event.threadID, event.messageID);

    } catch (err) {
      console.error("❌ bot handleReply error:", err);
    }
  },

  run: async function () {
    // not used (auto system)
  }
};