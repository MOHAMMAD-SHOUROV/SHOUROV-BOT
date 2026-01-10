const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_JSON = "https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json";

module.exports = {
  config: {
    name: "bot",
    version: "1.1.0",
    aliases: ["mim"],
    permission: 0,
    credits: "shourov",
    description: "talk with bot (no prefix + prefix)",
    prefix: true,
    category: "talk",
    usages: "bot",
    cooldowns: 3
  },

  /* ================= NO PREFIX ================= */
  handleEvent: async function ({ api, event, Users }) {
    try {
      if (!event.body) return;
      if (event.body.trim().toLowerCase() !== "bot") return;

      const name = await Users.getNameUser(event.senderID);

      const greetings = [
        "হুম জান বলো 😌",
        "কি গো ডাকছো কেন 🥱",
        "আমি এখানে 🖤",
        "হ্যাঁ শুনছি 😇"
      ];

      const msg = greetings[Math.floor(Math.random() * greetings.length)];

      return api.sendMessage(
        `${name}, ${msg}`,
        event.threadID,
        (err, info) => {
          global.client = global.client || {};
          global.client.handleReply = global.client.handleReply || [];
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

  /* ================= PREFIX ================= */
  start: async function ({ nayan, events, args, Users }) {
    try {
      const msg = args.join(" ").trim();

      const apiData = await axios.get(API_JSON);
      const simApi = apiData.data.sim;
      const fontApi = apiData.data.api2;

      // শুধু /bot
      if (!msg) {
        const name = await Users.getNameUser(events.senderID);
        return nayan.reply(
          `${name}, বলো জান 😌`,
          events.threadID,
          events.messageID
        );
      }

      /* ===== TEXT TYPE ===== */
      if (msg.startsWith("textType")) {
        const style = msg.split(" ")[1];
        const allow = ["serif","sans","italic","italic-sans","medieval","normal"];

        if (!allow.includes(style))
          return nayan.reply(
            `Invalid type!\nAvailable: ${allow.join(", ")}`,
            events.threadID,
            events.messageID
          );

        saveTextStyle(events.threadID, style);
        return nayan.reply(
          `✅ Text type set to ${style}`,
          events.threadID,
          events.messageID
        );
      }

      /* ===== SIM COMMANDS ===== */
      if (msg.startsWith("teach") || msg.startsWith("delete") || msg.startsWith("edit") || msg.startsWith("info") || msg.startsWith("askinfo")) {
        return handleSimCommands({ nayan, events, msg, simApi });
      }

      /* ===== NORMAL CHAT ===== */
      const res = await axios.get(
        `${simApi}/sim?type=ask&ask=${encodeURIComponent(msg)}`
      );

      let reply = res.data?.data?.msg || "🙂";

      const style = loadTextStyles()[events.threadID]?.style || "normal";
      try {
        const font = await axios.get(
          `${fontApi}/bold?text=${encodeURIComponent(reply)}&type=${style}`
        );
        reply = font.data?.data?.bolded || reply;
      } catch {}

      return nayan.reply(
        reply,
        events.threadID,
        (err, info) => {
          global.client.handleReply.push({
            name: "bot",
            messageID: info.messageID,
            author: events.senderID
          });
        },
        events.messageID
      );

    } catch (err) {
      console.error("[bot start]", err);
      return nayan.reply(
        "❌ এখন কথা বলতে পারছি না",
        events.threadID,
        events.messageID
      );
    }
  },

  /* ================= REPLY ================= */
  handleReply: async function ({ api, event }) {
    try {
      const apiData = await axios.get(API_JSON);
      const simApi = apiData.data.sim;
      const fontApi = apiData.data.api2;

      const res = await axios.get(
        `${simApi}/sim?type=ask&ask=${encodeURIComponent(event.body)}`
      );

      let reply = res.data?.data?.msg || "🙂";

      try {
        const font = await axios.get(
          `${fontApi}/bold?text=${encodeURIComponent(reply)}&type=normal`
        );
        reply = font.data?.data?.bolded || reply;
      } catch {}

      return api.sendMessage(reply, event.threadID, event.messageID);
    } catch (e) {
      console.error("[bot handleReply]", e);
    }
  }
};

/* ================= SIM COMMAND HANDLER ================= */
async function handleSimCommands({ nayan, events, msg, simApi }) {
  try {
    if (msg.startsWith("info")) {
      const r = await axios.get(`${simApi}/sim?type=info`);
      return nayan.reply(
        `Total Ask: ${r.data.data.totalKeys}\nTotal Answer: ${r.data.data.totalResponses}`,
        events.threadID,
        events.messageID
      );
    }

    if (msg.startsWith("askinfo")) {
      const q = msg.replace("askinfo", "").trim();
      const r = await axios.get(`${simApi}/sim?type=keyinfo&ask=${encodeURIComponent(q)}`);
      const ans = r.data.data.answers || [];
      if (!ans.length) return nayan.reply("No data found", events.threadID, events.messageID);

      return nayan.reply(
        ans.map((a,i)=>`📌 ${i+1}. ${a}`).join("\n"),
        events.threadID,
        events.messageID
      );
    }

    return nayan.reply("✅ Command processed", events.threadID, events.messageID);
  } catch {
    return nayan.reply("❌ Error", events.threadID, events.messageID);
  }
}

/* ================= STYLE ================= */
function loadTextStyles() {
  const p = path.join(__dirname, "system", "textStyles.json");
  if (!fs.existsSync(p)) fs.writeFileSync(p, "{}");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function saveTextStyle(threadID, style) {
  const data = loadTextStyles();
  data[threadID] = { style };
  fs.writeFileSync(
    path.join(__dirname, "system", "textStyles.json"),
    JSON.stringify(data, null, 2)
  );
}