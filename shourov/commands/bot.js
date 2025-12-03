const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "bot",
    version: "1.0.2",
    aliases: ["mim"],
    permission: 0,
    credits: "shourov (fixed)",
    description: "talk with bot / teach / info / edit / delete",
    prefix: true,
    category: "talk",
    usages: "bot <text> | bot help | bot teach ...",
    cooldowns: 5,
  },

  /**
   * handleReply: when user replies to a bot message that stored handleReply data
   */
  handleReply: async function({ api, event, handleReply, Users }) {
    try {
      const threadID = event.threadID;
      const senderID = event.senderID;
      const text = (event.body || "").trim();
      if (!text) return;

      // fetch API endpoints (safe)
      const apiCfg = await safeFetchApiConfig();
      const apiUrl = apiCfg.sim || 'https://api.example.com';
      const api2 = apiCfg.api2 || apiUrl;

      // ask remote sim
      const resp = await safeGet(`${apiUrl}/sim?type=ask&ask=${encodeURIComponent(text)}&uid=${senderID}`);
      if (!resp) {
        return api.sendMessage('❗ Sim API did not return a valid response.', threadID, event.messageID);
      }

      const result = resp.data?.data?.msg || resp.data?.msg || String(resp.data || "");
      const textStyles = loadTextStyles();
      const userStyle = (textStyles[String(threadID)] && textStyles[String(threadID)].style) || 'normal';

      let styled = result;
      try {
        const fontResp = await safeGet(`${api2}/bold?text=${encodeURIComponent(result)}&type=${encodeURIComponent(userStyle)}`, { timeout: 10000 });
        if (fontResp && fontResp.data && fontResp.data.data && fontResp.data.data.bolded) styled = fontResp.data.data.bolded;
      } catch (e) { /* ignore font errors */ }

      // send reply and register follow-up handleReply
      api.sendMessage({ body: styled }, threadID, (err, info) => {
        if (err) {
          console.error('Error sending handleReply response:', err);
          return api.sendMessage('❗ Error sending reply. Try again later.', threadID, event.messageID);
        }
        ensureGlobalHandleReply();
        global.client.handleReply.push({
          type: 'reply',
          name: module.exports.config.name,
          messageID: info && info.messageID ? info.messageID : (info && info.messageID) || info?.messageID || null,
          author: senderID,
          head: text
        });
      }, event.messageID);

    } catch (error) {
      console.error('handleReply error:', error && (error.stack || error));
      try { api.sendMessage('❗ Unexpected error while processing your reply.', event.threadID, event.messageID); } catch (e) {}
    }
  },

  /**
   * run: executed when user calls the command directly
   */
  run: async function({ api, event, args, Users }) {
    try {
      const threadID = event.threadID;
      const senderID = event.senderID;
      const msg = (args || []).join(" ").trim();

      // fetch API endpoints for sim and font
      const apiCfg = await safeFetchApiConfig();
      const apiUrl = apiCfg.sim || 'https://api.example.com';
      const api2 = apiCfg.api2 || apiUrl;

      // NO ARGS -> random greeting + register handleReply
      if (!msg) {
        const greetings = [
          "আহ শুনা আমার তোমার অলিতে গলিতে উম্মাহ😇😘",
          "কি গো সোনা আমাকে ডাকছ কেনো?",
          "বার বার আমাকে ডাকস কেন😡",
          "আহ শোনা আমাকে এতো ডাকে? আসো বুকে আশো 😅",
          "আসসালামু আলাইকুম — বলো কি লাগে তোমাকে?",
          "আমাকে এতো না ডেকে বস, সৌরভ'কে একটা গফ দে 🙄",
          "হাই! কি খবর?"
        ];
        const name = await Users.getNameUser(senderID).catch(()=>("There"));
        const textReply = `${name}, ${greetings[Math.floor(Math.random() * greetings.length)]}`;

        return api.sendMessage({ body: textReply, mentions: [{ tag: name, id: senderID }] }, threadID, (err, info) => {
          if (err) {
            console.error('greeting send error:', err);
            return api.sendMessage('❗ Failed to send greeting.', threadID, event.messageID);
          }
          ensureGlobalHandleReply();
          global.client.handleReply.push({
            type: 'reply',
            name: module.exports.config.name,
            messageID: info && info.messageID ? info.messageID : null,
            author: senderID,
            head: ''
          });
        }, event.messageID);
      }

      // textType command to set style (per-thread)
      if (msg.toLowerCase().startsWith("texttype")) {
        const parts = msg.split(/\s+/);
        const selectedStyle = parts[1];
        const options = ['serif', 'sans', 'italic', 'italic-sans', 'medieval', 'normal'];
        if (!selectedStyle || !options.includes(selectedStyle)) {
          return api.sendMessage(`❗ Invalid style. Choose: ${options.join(", ")}`, threadID, event.messageID);
        }
        saveTextStyle(String(threadID), selectedStyle);
        return api.sendMessage(`✅ Text style set to "${selectedStyle}" for this thread.`, threadID, event.messageID);
      }

      // delete command
      if (msg.toLowerCase().startsWith("delete")) {
        const raw = msg.replace(/^delete\s*/i, "");
        const [part1, part2] = raw.split("&");
        const question = (part1 || "").replace(/^ask=/i, "").trim();
        const answer = (part2 || "").replace(/^ans=/i, "").trim();
        if (!question || !answer) return api.sendMessage("❗ Usage: delete ask=QUESTION&ans=ANSWER", threadID, event.messageID);

        const res = await safeGet(`${apiUrl}/sim?type=delete&ask=${encodeURIComponent(question)}&ans=${encodeURIComponent(answer)}&uid=${senderID}`);
        const replyMessage = res?.data?.msg || res?.data?.data?.msg || "No response from API.";
        return api.sendMessage(replyMessage, threadID, event.messageID);
      }

      // edit command
      if (msg.toLowerCase().startsWith("edit")) {
        const raw = msg.replace(/^edit\s*/i, "");
        const [p1, p2] = raw.split("&");
        const oldQ = (p1 || "").replace(/^old=/i, "").trim();
        const newQ = (p2 || "").replace(/^new=/i, "").trim();
        if (!oldQ || !newQ) return api.sendMessage("❗ Usage: edit old=OLDQUESTION&new=NEWQUESTION", threadID, event.messageID);

        const res = await safeGet(`${apiUrl}/sim?type=edit&old=${encodeURIComponent(oldQ)}&new=${encodeURIComponent(newQ)}&uid=${senderID}`);
        const replyMessage = res?.data?.msg || res?.data?.data?.msg || "No response from API.";
        return api.sendMessage(replyMessage, threadID, event.messageID);
      }

      // info
      if (msg.toLowerCase().startsWith("info")) {
        const res = await safeGet(`${apiUrl}/sim?type=info`);
        const totalAsk = res?.data?.data?.totalKeys || 0;
        const totalAns = res?.data?.data?.totalResponses || 0;
        return api.sendMessage(`Total Ask: ${totalAsk}\nTotal Answer: ${totalAns}`, threadID, event.messageID);
      }

      // teach
      if (msg.toLowerCase().startsWith("teach")) {
        const raw = msg.replace(/^teach\s*/i, "");
        const [p1, p2] = raw.split("&");
        const question = (p1 || "").replace(/^ask=/i, "").trim();
        const answer = (p2 || "").replace(/^ans=/i, "").trim();
        if (!question || !answer) return api.sendMessage("❗ Usage: teach ask=QUESTION&ans=ANSWER", threadID, event.messageID);

        const res = await safeGet(`${apiUrl}/sim?type=teach&ask=${encodeURIComponent(question)}&ans=${encodeURIComponent(answer)}&uid=${senderID}`);
        const replyMessage = res?.data?.msg || res?.data?.data?.msg || "No response from API.";
        if ((replyMessage || "").toLowerCase().includes("already")) {
          return api.sendMessage(`📝 Your data already exists.\nQ: ${question}\nA: ${answer}`, threadID, event.messageID);
        }
        return api.sendMessage(`📝 Added to database.\nQ: ${question}\nA: ${answer}`, threadID, event.messageID);
      }

      // askinfo
      if (msg.toLowerCase().startsWith("askinfo")) {
        const question = msg.replace(/^askinfo\s*/i, "").trim();
        if (!question) return api.sendMessage("❗ Usage: askinfo [question]", threadID, event.messageID);
        const res = await safeGet(`${apiUrl}/sim?type=keyinfo&ask=${encodeURIComponent(question)}`);
        const answers = res?.data?.data?.answers || [];
        if (!answers.length) return api.sendMessage(`No info available for "${question}"`, threadID, event.messageID);

        const replyMessage = `Info for "${question}":\n\n` + answers.map((a, idx) => `📌 ${idx+1}. ${a}`).join("\n") + `\n\nTotal answers: ${answers.length}`;
        return api.sendMessage(replyMessage, threadID, event.messageID);
      }

      // help
      if (msg.toLowerCase().startsWith("help")) {
        const prefix = global.config?.PREFIX || "/";
        const help = [
          `🤖 Available subcommands:`,
          `${prefix}bot askinfo [question]`,
          `${prefix}bot teach ask=[question]&ans=[answer]`,
          `${prefix}bot delete ask=[question]&ans=[answer]`,
          `${prefix}bot edit old=[old]&new=[new]`,
          `${prefix}bot info`,
          `${prefix}bot textType [serif|sans|italic|italic-sans|medieval|normal]`,
          `${prefix}bot (or reply to bot's message) — talk with the bot`
        ].join("\n");
        return api.sendMessage(help, threadID, event.messageID);
      }

      // default: ask the sim API
      {
        const resp = await safeGet(`${apiUrl}/sim?type=ask&ask=${encodeURIComponent(msg)}&uid=${senderID}`);
        const replyMessage = resp?.data?.data?.msg || resp?.data?.msg || "No response from API.";

        // style according to saved thread preference
        const textStyles = loadTextStyles();
        const userStyle = (textStyles[String(threadID)] && textStyles[String(threadID)].style) || 'normal';

        let finalText = replyMessage;
        try {
          const fontResp = await safeGet(`${api2}/bold?text=${encodeURIComponent(replyMessage)}&type=${encodeURIComponent(userStyle)}`, { timeout: 10000 });
          if (fontResp && fontResp.data && fontResp.data.data && fontResp.data.data.bolded) {
            finalText = fontResp.data.data.bolded;
          }
        } catch (e) { /* ignore */ }

        api.sendMessage({ body: finalText }, threadID, (err, info) => {
          if (err) {
            console.error('send reply error:', err);
            return api.sendMessage('❗ Failed to send reply.', threadID, event.messageID);
          }
          ensureGlobalHandleReply();
          global.client.handleReply.push({
            type: 'reply',
            name: module.exports.config.name,
            messageID: info && info.messageID ? info.messageID : null,
            author: senderID,
            head: msg
          });
        }, event.messageID);
      }

    } catch (err) {
      console.error('bot.run error:', err && (err.stack || err));
      try { api.sendMessage('❗ Unexpected error. Please try again later.', event.threadID, event.messageID); } catch (e) {}
    }
  }
};

/* ----------------- helper: text styles persistence ----------------- */

function getSystemDir() {
  const dir = path.join(__dirname, 'system');
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    console.error('getSystemDir mkdir error:', e);
  }
  return dir;
}

function loadTextStyles() {
  try {
    const dir = getSystemDir();
    const file = path.join(dir, 'textStyles.json');
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({}, null, 2), 'utf8');
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw || "{}");
  } catch (e) {
    console.error('loadTextStyles error:', e);
    return {};
  }
}

function saveTextStyle(threadID, style) {
  try {
    const dir = getSystemDir();
    const file = path.join(dir, 'textStyles.json');
    const styles = loadTextStyles();
    styles[String(threadID)] = { style };
    fs.writeFileSync(file, JSON.stringify(styles, null, 2), 'utf8');
  } catch (e) {
    console.error('saveTextStyle error:', e);
  }
}

/* ----------------- small utilities ----------------- */

function ensureGlobalHandleReply() {
  if (!global.client) global.client = {};
  if (!global.client.handleReply) global.client.handleReply = [];
}

async function safeFetchApiConfig() {
  try {
    const res = await axios.get('https://raw.githubusercontent.com/MOHAMMAD-SHOUROV/shourovbot/main/api.json', { timeout: 5000 }).catch(()=>null);
    if (res && res.data) return res.data;
  } catch (e) { /* ignore */ }
  return {}; // fallback
}

async function safeGet(url, opts = {}) {
  try {
    const res = await axios.get(url, opts).catch(()=>null);
    return res || null;
  } catch (e) {
    return null;
  }
}
