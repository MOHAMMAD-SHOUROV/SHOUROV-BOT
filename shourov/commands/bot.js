const axios = require("axios");

module.exports = {
  config: {
    name: "bot",
    version: "2.2.0",
    permission: 0,
    credits: "shourov (reply fixed)",
    prefix: true,
    description: "Bot talk with reply support",
    category: "talk",
    usages: "bot",
    cooldowns: 3
  },

  // =================================================
  // 🔥 NO PREFIX → শুধু "Bot" লিখলে
  // =================================================
  handleEvent: async function ({ api, event, Users }) {
    if (!event.body) return;
    if (event.senderID === api.getCurrentUserID()) return;

    const body = event.body.trim().toLowerCase();
    if (body !== "bot") return;

    const name = await Users.getNameUser(event.senderID);

    const replies = ["বলো জান 😌", "কি বলবা 🖤", "আমি শুনছি 😊"];
    const msg = replies[Math.floor(Math.random() * replies.length)];

    return api.sendMessage(
      `🤖 ${name}, ${msg}`,
      event.threadID,
      (err, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID
        });
      },
      event.messageID
    );
  },

  // =================================================
  // 🔹 PREFIX → /bot hi
  // =================================================
  run: async function ({ api, event, args }) {
    if (event.senderID === api.getCurrentUserID()) return;

    const msg = args.join(" ");
    if (!msg) return api.sendMessage("🤖 বলো জান 😌", event.threadID);

    const apiJson = await axios.get(
      "https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json"
    );

    const simApi = apiJson.data.sim;
    const fontApi = apiJson.data.api2;

    const res = await axios.get(
      `${simApi}/sim?type=ask&ask=${encodeURIComponent(msg)}`
    );

    let reply = res.data?.data?.msg || "😅 বুঝিনি";

    try {
      const styled = await axios.get(
        `${fontApi}/bold?text=${encodeURIComponent(reply)}&type=normal`
      );
      reply = styled.data.data.bolded;
    } catch {}

    return api.sendMessage(reply, event.threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID
      });
    });
  },

  // =================================================
  // 🔁 REPLY দিলে কাজ করবে (FIXED)
  // =================================================
  handleReply: async function ({ api, event, handleReply }) {
    if (event.senderID === api.getCurrentUserID()) return;

    // ✅ নিশ্চিত করি reply bot এর message এ
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
  }
};