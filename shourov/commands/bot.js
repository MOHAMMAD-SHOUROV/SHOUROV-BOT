// commands/bot.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "bot",
    version: "1.0.2",
    aliases: ["mim"],
    permission: 0,
    credits: "shourov",
    description: "talk with bot",
    prefix: true, // use boolean; loader will use global.config.PREFIX or default
    category: "talk",
    usages: "hi",
    cooldowns: 5,
  },

  // handle replies to messages sent by this command
  handleReply: async function ({ api, event }) {
    try {
      const apiJson = await safeLoadApiJson();
      const apiUrl = apiJson?.sim;
      const apiUrl2 = apiJson?.api2;

      if (!apiUrl) return safeSend(api, event.threadID, "Sim API unavailable.");

      const resp = await axios.get(`${apiUrl}/sim?type=ask&ask=${encodeURIComponent(event.body)}`, { timeout: 10000 });
      const result = resp.data?.data?.msg || resp.data?.msg || "No response";

      const styles = loadTextStyles();
      const userStyle = styles[event.threadID]?.style || 'normal';

      let finalText = result;
      if (apiUrl2) {
        try {
          const f = await axios.get(`${apiUrl2}/bold?text=${encodeURIComponent(result)}&type=${encodeURIComponent(userStyle)}`, { timeout: 8000 });
          finalText = f.data?.data?.bolded || result;
        } catch (e) {
          finalText = result;
        }
      }

      safeSend(api, event.threadID, finalText, (err, info) => {
        if (!global.client) global.client = {};
        if (!global.client.handleReply) global.client.handleReply = [];
        global.client.handleReply.push({
          type: 'reply',
          name: this.config.name,
          messageID: info?.messageID || null,
          author: event.senderID,
          head: event.body
        });
      }, event.messageID);
    } catch (err) {
      console.error("handleReply error:", err && (err.stack || err));
      try { safeSend(api, event.threadID, "Error processing reply."); } catch (_) {}
    }
  },

  // support both "start" (some loaders) and "run" (others)
  start: async function (context) {
    return commandHandler(context);
  },

  run: async function (context) {
    return commandHandler(context);
  }
};

// main handler used by both start/run
async function commandHandler({ shourov, nayan, api, event, args = [], Users }) {
  // detect bot api object to reply: prefer shourov -> nayan -> api
  const bot = shourov || nayan || api;
  if (!bot) {
    console.error("No bot API object provided to commandHandler.");
    return;
  }

  const threadID = event.threadID;
  const messageID = event.messageID;
  const msg = (args || []).join(" ").trim();

  try {
    const apiJson = await safeLoadApiJson();
    const apiUrl = apiJson?.sim || null;
    const api2 = apiJson?.api2 || null;

    // no args => greet and register handleReply
  if (!msg) {
  const greetings = [
    "আহ শুনা আমার তোমার অলিতে গলিতে উম্মাহ😇😘",
    "কি গো সোনা আমাকে ডাকছ কেনো",
    "বার বার আমাকে ডাকস কেন😡",
    "আহ শোনা আমার আমাকে এতো ডাকে কেনো আসো বুকে আশো🥱",
    "হুম জান তোমার অইখানে উম্মমাহ😷😘",
    "আসসালামু আলাইকুম বলেন আপনার জন্য কি করতে পারি",
    "আমাকে এতো না ডেকে বস সৌরভ'কে একটা গফ দে 🙄"
  ];

  const name = await getUserName(bot, event.senderID);
  const rand = greetings[Math.floor(Math.random() * greetings.length)];

  return safeReply(
    bot,
    threadID,
    `${name}, ${rand}`,
    messageID,
    (err, info) => {
      global.client = global.client || {};
      global.client.handleReply = global.client.handleReply || [];
      global.client.handleReply.push({
        type: 'reply',
        name: "bot",
        messageID: info?.messageID || null,
        author: event.senderID,
        head: msg
      });
    }
  );
}

    // textType command
    if (msg.startsWith("textType")) {
      const selectedStyle = msg.split(" ")[1];
      const options = ['serif', 'sans', 'italic', 'italic-sans', 'medieval', 'normal'];
      if (options.includes(selectedStyle)) {
        saveTextStyle(event.threadID, selectedStyle);
        return safeReply(bot, threadID, `Text type set to "${selectedStyle}" successfully!`, messageID);
      } else return safeReply(bot, threadID, `Invalid type. Choose: ${options.join(", ")}`, messageID);
    }

    // delete
    if (msg.startsWith("delete")) {
      if (!apiUrl) return safeReply(bot, threadID, 'Sim API unavailable.', messageID);
      const parts = msg.replace("delete", "").trim().split("&");
      const q = (parts[0] || "").replace("ask=", "").trim();
      const a = (parts[1] || "").replace("ans=", "").trim();
      const d = await axios.get(`${apiUrl}/sim?type=delete&ask=${encodeURIComponent(q)}&ans=${encodeURIComponent(a)}&uid=${event.senderID}`, { timeout: 10000 });
      const replyMessage = d.data?.msg || d.data?.data?.msg || "No response";
      return safeReply(bot, threadID, replyMessage, messageID);
    }

    // edit
    if (msg.startsWith("edit")) {
      if (!apiUrl) return safeReply(bot, threadID, 'Sim API unavailable.', messageID);
      const params = msg.replace("edit", "").trim().split("&");
      const oldQ = (params[0] || "").replace("old=", "").trim();
      const newQ = (params[1] || "").replace("new=", "").trim();
      const d = await axios.get(`${apiUrl}/sim?type=edit&old=${encodeURIComponent(oldQ)}&new=${encodeURIComponent(newQ)}&uid=${event.senderID}`, { timeout: 10000 });
      const replyMessage = d.data?.msg || d.data?.data?.msg || "No response";
      return safeReply(bot, threadID, replyMessage, messageID);
    }

    // info
    if (msg.startsWith("info")) {
      if (!apiUrl) return safeReply(bot, threadID, 'Sim API unavailable.', messageID);
      const r = await axios.get(`${apiUrl}/sim?type=info`, { timeout: 10000 });
      const totalAsk = r.data?.data?.totalKeys || 0;
      const totalAns = r.data?.data?.totalResponses || 0;
      return safeReply(bot, threadID, `Total Ask: ${totalAsk}\nTotal Answer: ${totalAns}`, messageID);
    }

    // teach
    if (msg.startsWith("teach")) {
      if (!apiUrl) return safeReply(bot, threadID, 'Sim API unavailable.', messageID);
      const teachParams = msg.replace("teach", "").trim().split("&");
      const q = (teachParams[0] || "").replace("ask=", "").trim();
      const a = (teachParams[1] || "").replace("ans=", "").trim();
      const resp = await axios.get(`${apiUrl}/sim?type=teach&ask=${encodeURIComponent(q)}&ans=${encodeURIComponent(a)}`, { timeout: 10000 });
      const replyMessage = resp.data?.msg || "";
      const ask = resp.data?.data?.ask || q;
      const ans = resp.data?.data?.ans || a;
      if (replyMessage && replyMessage.toString().toLowerCase().includes("already")) {
        return safeReply(bot, threadID, `📝Your Data Already Added To Database\n1️⃣ASK: ${ask}\n2️⃣ANS: ${ans}`, messageID);
      }
      return safeReply(bot, threadID, `📝Your Data Added To Database Successfully\n1️⃣ASK: ${ask}\n2️⃣ANS: ${ans}`, messageID);
    }

    // askinfo
    if (msg.startsWith("askinfo")) {
      if (!apiUrl) return safeReply(bot, threadID, 'Sim API unavailable.', messageID);
      const question = msg.replace("askinfo", "").trim();
      if (!question) return safeReply(bot, threadID, 'Provide a question after askinfo.', messageID);
      const r = await axios.get(`${apiUrl}/sim?type=keyinfo&ask=${encodeURIComponent(question)}`, { timeout: 10000 });
      const answers = r.data?.data?.answers || [];
      if (!answers.length) return safeReply(bot, threadID, `No information for "${question}"`, messageID);
      const replyMessage = `Info for "${question}":\n\n` + answers.map((x, i) => `📌 ${i+1}. ${x}`).join("\n") + `\n\nTotal answers: ${answers.length}`;
      return safeReply(bot, threadID, replyMessage, messageID);
    }

    // help
    if (msg.startsWith("help")) {
      const prefix = (global.config && global.config.PREFIX) ? global.config.PREFIX : "/";
      const help = `🌟 Commands:\n${prefix}bot askinfo [q]\n${prefix}bot teach ask=[q]&ans=[a]\n${prefix}bot delete ask=[q]&ans=[a]\n${prefix}bot edit old=[old]&new=[new]\n${prefix}bot info\n${prefix}bot textType [type]\n${prefix}bot (no args) -> greeting`;
      return safeReply(bot, threadID, help, messageID);
    }

    // default: ask sim api and style text
    if (!apiUrl) return safeReply(bot, threadID, 'Sim API unavailable.', messageID);

    const r = await axios.get(`${apiUrl}/sim?type=ask&ask=${encodeURIComponent(msg)}`, { timeout: 10000 });
    const replyMessage = r.data?.data?.msg || r.data?.msg || "No response";

    const styles = loadTextStyles();
    const userStyle = styles[event.threadID]?.style || 'normal';
    let styled = replyMessage;
    if (api2) {
      try {
        const f = await axios.get(`${api2}/bold?text=${encodeURIComponent(replyMessage)}&type=${encodeURIComponent(userStyle)}`, { timeout: 8000 });
        styled = f.data?.data?.bolded || replyMessage;
      } catch (e) { styled = replyMessage; }
    }

    safeReply(bot, threadID, styled, messageID, (err, info) => {
      global.client = global.client || {};
      global.client.handleReply = global.client.handleReply || [];
      global.client.handleReply.push({
        type: 'reply',
        name: "bot",
        messageID: info?.messageID || null,
        author: event.senderID,
        head: msg
      });
    });

  } catch (err) {
    console.error("commandHandler error:", err && (err.stack || err));
    safeReply(shourov || nayan || api, event.threadID, 'An error has occurred. Try again later.', event.messageID);
  }
}

// helper to send message compatible with various objects
function safeSend(apiObj, threadID, body, cb, replyMessageID) {
  try {
    if (!apiObj) return;
    // many loaders use api.sendMessage
    if (typeof apiObj.sendMessage === "function") return apiObj.sendMessage(body, threadID, cb || (() => {}), replyMessageID);
    // some use reply method: shourov.reply / nayan.reply
    if (typeof apiObj.reply === "function") return apiObj.reply(body, threadID, cb || (() => {}), replyMessageID);
    // fallback: console
    console.warn("No send method found on apiObj");
  } catch (e) {
    console.error("safeSend error:", e && e.message ? e.message : e);
  }
}

// wrapper accepts both api object and event-style call
function safeReply(apiObj, threadID, body, messageID, cb) {
  return safeSend(apiObj, threadID, { body }, cb, messageID);
}

// load remote api.json safely
async function safeLoadApiJson() {
  try {
    const res = await axios.get('https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json', { timeout: 8000 });
    return res.data || {};
  } catch (e) {
    console.warn("safeLoadApiJson failed:", e && e.message ? e.message : e);
    return {};
  }
}

// text styles persistence
function loadTextStyles() {
  const Path = path.join(__dirname, 'system', 'textStyles.json');
  try {
    if (!fs.existsSync(Path)) {
      fs.mkdirSync(path.dirname(Path), { recursive: true });
      fs.writeFileSync(Path, JSON.stringify({}, null, 2));
    }
    const data = fs.readFileSync(Path, 'utf8');
    return JSON.parse(data || '{}');
  } catch (e) {
    console.error("loadTextStyles error:", e);
    return {};
  }
}

function saveTextStyle(threadID, style) {
  const Path = path.join(__dirname, 'system', 'textStyles.json');
  try {
    const styles = loadTextStyles();
    styles[threadID] = { style };
    fs.mkdirSync(path.dirname(Path), { recursive: true });
    fs.writeFileSync(Path, JSON.stringify(styles, null, 2));
  } catch (e) {
    console.error("saveTextStyle error:", e);
  }
}