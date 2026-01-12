const axios = require("axios");

module.exports = {
  config: {
    name: "bot",
    version: "3.0.0",
    permission: 0,
    credits: "shourov (final fixed)",
    prefix: false,
    description: "Smart bot talk (no / , no double reply)",
    category: "talk",
    usages: "Bot / Bot কেমন আছো",
    cooldowns: 3
  },

  // =================================================
  // 🔥 AUTO TRIGGER (NO PREFIX)
  // =================================================
  handleEvent: async function ({ api, event, Users }) {
    try {
      if (!event.body) return;
      if (event.senderID === api.getCurrentUserID()) return;

      const body = event.body.trim();
      const text = body.toLowerCase();

      // ❌ slash command বাদ
      if (text.startsWith("/")) return;

      // ✅ allowed bot triggers
      const botTriggers = [
        "bot",
        "hello bot",
        "hi bot",
        "hey bot"
      ];

      const matched = botTriggers.some(t => text.includes(t));
      if (!matched) return;

      const name = await Users.getNameUser(event.senderID);

      const replies = [
        "কি বলবা 😌",
        "আমি শুনছি 🖤",
        "বল জান 😊",
        "হুম বলো 👀"
      ];

      const msg = replies[Math.floor(Math.random() * replies.length)];

      return api.sendMessage(
        `🤖 ${name}, ${msg}`,
        event.threadID,
        (err, info) => {
          if (!err && info?.messageID) {
            global.client.handleReply.push({
              name: this.config.name,
              messageID: info.messageID,
              author: event.senderID
            });
          }
        },
        event.messageID
      );
    } catch (e) {
      console.error("bot handleEvent error:", e);
    }
  },

  // =================================================
  // 🔹 REPLY দিলে AI উত্তর দিবে
  // =================================================
  handleReply: async function ({ api, event, handleReply }) {
    try {
      if (event.senderID !== handleReply.author) return;

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
    } catch (e) {
      console.error("bot handleReply error:", e);
    }
  },

  // =================================================
  // loader compatibility
  // =================================================
  run: async function () {}
};