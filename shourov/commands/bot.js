// commands/bot.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "bot",
    version: "1.0.3",
    aliases: ["mim"],
    permission: 0,
    credits: "shourov",
    description: "talk with bot",
    prefix: true,
    category: "talk",
    usages: "hi",
    cooldowns: 5
  },

  // ================= HANDLE REPLY =================
  handleReply: async function ({ api, event }) {
    try {
      const userName =
        global.data?.userName?.get(event.senderID) ||
        (await api.getUserInfo(event.senderID))[event.senderID]?.name ||
        "User";

      const apiJson = await safeLoadApiJson();
      const apiUrl = apiJson?.sim;
      const apiUrl2 = apiJson?.api2;

      if (!apiUrl)
        return api.sendMessage(
          "Sim API unavailable ❌",
          event.threadID,
          event.messageID
        );

      const r = await axios.get(
        ${apiUrl}/sim?type=ask&ask=${encodeURIComponent(event.body)},
        { timeout: 10000 }
      );

      const result =
        r.data?.data?.msg ||
        r.data?.msg ||
        "No response";

      const styles = loadTextStyles();
      const style = styles[event.threadID]?.style || "normal";

      let finalText = result;
      if (apiUrl2) {
        try {
          const f = await axios.get(
            ${apiUrl2}/bold?text=${encodeURIComponent(result)}&type=${style},
            { timeout: 8000 }
          );
          finalText = f.data?.data?.bolded || result;
        } catch (_) {}
      }

      api.sendMessage(
        ${userName}, ${finalText},
        event.threadID,
        (err, info) => {
          global.client.handleReply.push({
            type: "reply",
            name: "bot",
            messageID: info.messageID,
            author: event.senderID
          });
        },
        event.messageID
      );

    } catch (e) {
      console.error("handleReply error:", e);
      api.sendMessage(
        "Reply error ❌",
        event.threadID,
        event.messageID
      );
    }
  },

  // ================= MAIN RUN =================
  run: async function ({ api, event, args, Users }) {
    const msg = args.join(" ").trim();
    const threadID = event.threadID;
    const messageID = event.messageID;

    const userName =
      global.data?.userName?.get(event.senderID) ||
      (Users ? await Users.getNameUser(event.senderID) : null) ||
      "User";

    const apiJson = await safeLoadApiJson();
    const apiUrl = apiJson?.sim;
    const api2 = apiJson?.api2;

    // -------- NO ARG (Greeting) --------
    if (!msg) {
      const greetings = [
        "আহ শুনা আমার তোমার অলিতে গলিতে উম্মাহ 😘",
        "কি গো সোনা আমাকে ডাকছ কেনো",
        "বার বার আমাকে ডাকস কেন 😡",
        "আসসালামু আলাইকুম বলেন কি করতে পারি",
        "হুম জান উম্মাহ 😷😘"
      ];
      const rand = greetings[Math.floor(Math.random() * greetings.length)];

      return api.sendMessage(
        ${userName}, ${rand},
        threadID,
        (err, info) => {
          global.client.handleReply.push({
            type: "reply",
            name: "bot",
            messageID: info.messageID,
            author: event.senderID
          });
        },
        messageID
      );
    }

    // -------- TEXT TYPE --------
    if (msg.startsWith("textType")) {
      const type = msg.split(" ")[1];
      const allow = ["serif", "sans", "italic", "italic-sans", "medieval", "normal"];
      if (!allow.includes(type))
        return api.sendMessage(
          Invalid type ❌\nUse: ${allow.join(", ")},
          threadID,
          messageID
        );

      saveTextStyle(threadID, type);
      return api.sendMessage(
        Text type set to "${type}" ✅,
        threadID,
        messageID
      );
    }

    // -------- HELP --------
    if (msg === "help") {
      const p = global.config.PREFIX || "/";
      return api.sendMessage(
       🌟 Bot Commands\n\n${p}bot\n${p}bot textType [type]\n${p}bot teach ask=[q]&ans=[a]\n${p}bot delete ask=[q]&ans=[a]\n${p}bot info`,
        threadID,
        messageID
      );
    }

    // -------- SIM ASK --------
    if (!apiUrl)
      return api.sendMessage(
        "Sim API unavailable ❌",
        threadID,
        messageID
      );

    const r = await axios.get(
      ${apiUrl}/sim?type=ask&ask=${encodeURIComponent(msg)},
      { timeout: 10000 }
    );

    let reply =
      r.data?.data?.msg ||
      r.data?.msg ||
      "No response";

    const styles = loadTextStyles();
    const style = styles[threadID]?.style || "normal";

    if (api2) {
      try {
        const f = await axios.get(
          ${api2}/bold?text=${encodeURIComponent(reply)}&type=${style}
        );
        reply = f.data?.data?.bolded || reply;
      } catch (_) {}
    }

    api.sendMessage(
      ${userName}, ${reply},
      threadID,
      (err, info) => {
        global.client.handleReply.push({
          type: "reply",
          name: "bot",
          messageID: info.messageID,
          author: event.senderID
        });
      },
      messageID
    );
  }
};

// ================= HELPERS =================

async function safeLoadApiJson() {
  try {
    const r = await axios.get(
      "https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json",
      { timeout: 8000 }
    );
    return r.data || {};
  } catch {
    return {};
  }
}

function loadTextStyles() {
  const p = path.join(__dirname, "system", "textStyles.json");
  if (!fs.existsSync(p)) {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, "{}");
  }
  return JSON.parse(fs.readFileSync(p));
}

function saveTextStyle(threadID, style) {
  const p = path.join(__dirname, "system", "textStyles.json");
  const d = loadTextStyles();
  d[threadID] = { style };
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
}
