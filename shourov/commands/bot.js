const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "bot",
    version: "1.0.1",
    aliases: ["mim"],
    permission: 0,
    credits: "shourov",
    description: "talk with bot",
    prefix: 3,
    category: "talk",
    usages: "hi",
    cooldowns: 5,
  },

  /**
   * handleReply will be called when someone replies to a message that this command sent
   * @param {object} param0 - { api, event }
   */
  handleReply: async function ({ api, event }) {
    try {
      // load api endpoints
      const apiJson = await axios.get('https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json', { timeout: 8000 });
      const apiUrl = apiJson.data?.sim;
      const apiUrl2 = apiJson.data?.api2;

      if (!apiUrl) return api.sendMessage("API endpoint unavailable.", event.threadID);

      // ask sim with the reply body
      const resp = await axios.get(`${apiUrl}/sim?type=ask&ask=${encodeURIComponent(event.body)}`, { timeout: 10000 });
      const result = resp.data?.data?.msg || resp.data?.msg || "No response from sim API";

      // load style for thread
      const textStyles = loadTextStyles();
      const userStyle = textStyles[event.threadID]?.style || 'normal';

      // stylize text via api2
      let finalText = result;
      if (apiUrl2) {
        try {
          const fontResp = await axios.get(`${apiUrl2}/bold?text=${encodeURIComponent(result)}&type=${encodeURIComponent(userStyle)}`, { timeout: 8000 });
          finalText = fontResp.data?.data?.bolded || result;
        } catch (e) {
          // fallback to plain result if styling fails
          finalText = result;
        }
      }

      api.sendMessage(finalText, event.threadID, (error, info) => {
        if (error) {
          console.error('Error sending handleReply response:', error);
          return api.sendMessage('An error occurred while sending reply. Try again later.', event.threadID);
        }

        // ensure global.client.handleReply exists
        global.client = global.client || {};
        global.client.handleReply = global.client.handleReply || [];

        global.client.handleReply.push({
          type: 'reply',
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          head: event.body
        });
      }, event.messageID);
    } catch (error) {
      console.error('Error in handleReply:', error && (error.stack || error));
      try { api.sendMessage('An error occurred while processing your reply.', event.threadID); } catch (_) {}
    }
  },

  /**
   * start will be called when user invokes /bot (or prefix+bot) command
   * signature depends on your bot loader; here I accept { shourov, event, args, Users }
   */
  start: async function ({ shourov, event, args, Users }) {
    try {
      const msg = (args || []).join(" ").trim();

      // load api.json once
      let apiJson = null;
      try {
        apiJson = (await axios.get('https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json', { timeout: 8000 })).data;
      } catch (e) {
        console.warn("Could not load remote api.json:", e && e.message ? e.message : e);
      }
      const apiUrl = apiJson?.sim || null;

      // if no message -> send greeting and register handleReply
      if (!msg) {
        const greetings = [
          "আহ শুনা আমার তোমার অলিতে গলিতে উম্মাহ😇😘",
          "কি গো সোনা আমাকে ডাকছ কেনো",
          "বার বার আমাকে ডাকস কেন😡",
          "আহ শোনা আমার আমাকে এতো ডাকে কেনো আসো বুকে আশো🥱",
          "হুম জান তোমার অইখানে উম্মমাহ😷😘",
          "আসসালামু আলাইকুম বলেন আপনার জন্য কি করতে পারি",
          "আমাকে এতো না ডেকে বস সৌরভ'কে একটা গফ দে 🙄",
          "jang hanga korba",
          "jang bal falaba🙂"
        ];
        const name = (Users && typeof Users.getNameUser === 'function') ? await Users.getNameUser(event.senderID) : event.senderID;
        const rand = greetings[Math.floor(Math.random() * greetings.length)];

        return shourov.reply({
          body: `${name}, ${rand}`,
          mentions: [{ tag: name, id: event.senderID }]
        }, event.threadID, (error, info) => {
          if (error) {
            console.error("Greeting reply error:", error);
            return shourov.reply('An error occurred while processing your request. Please try again later.', event.threadID, event.messageID);
          }

          global.client = global.client || {};
          global.client.handleReply = global.client.handleReply || [];
          global.client.handleReply.push({
            type: 'reply',
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            head: msg
          });
        }, event.messageID);
      }

      // set text style for this thread
      if (msg.startsWith("textType")) {
        const selectedStyle = msg.split(" ")[1];
        const options = ['serif', 'sans', 'italic', 'italic-sans', 'medieval', 'normal'];

        if (options.includes(selectedStyle)) {
          saveTextStyle(event.threadID, selectedStyle);
          return shourov.reply({ body: `Text type set to "${selectedStyle}" successfully!` }, event.threadID, event.messageID);
        } else {
          return shourov.reply({ body: `Invalid text type! Please choose from: ${options.join(", ")}` }, event.threadID, event.messageID);
        }
      }

      // delete pair
      if (msg.startsWith("delete")) {
        if (!apiUrl) return shourov.reply('Sim API not available right now.', event.threadID, event.messageID);
        const deleteParams = msg.replace("delete", "").trim().split("&");
        const question = (deleteParams[0] || "").replace("ask=", "").trim();
        const answer = (deleteParams[1] || "").replace("ans=", "").trim();

        const d = await axios.get(`${apiUrl}/sim?type=delete&ask=${encodeURIComponent(question)}&ans=${encodeURIComponent(answer)}&uid=${event.senderID}`, { timeout: 10000 });
        const replyMessage = d.data?.msg || d.data?.data?.msg || "No response";
        return shourov.reply({ body: replyMessage }, event.threadID, event.messageID);
      }

      // edit question
      if (msg.startsWith("edit")) {
        if (!apiUrl) return shourov.reply('Sim API not available right now.', event.threadID, event.messageID);
        const editParams = msg.replace("edit", "").trim().split("&");
        const oldQuestion = (editParams[0] || "").replace("old=", "").trim();
        const newQuestion = (editParams[1] || "").replace("new=", "").trim();

        const d = await axios.get(`${apiUrl}/sim?type=edit&old=${encodeURIComponent(oldQuestion)}&new=${encodeURIComponent(newQuestion)}&uid=${event.senderID}`, { timeout: 10000 });
        const replyMessage = d.data?.msg || d.data?.data?.msg || "No response received.";
        return shourov.reply({ body: replyMessage }, event.threadID, event.messageID);
      }

      // info stats
      if (msg.startsWith("info")) {
        if (!apiUrl) return shourov.reply('Sim API not available right now.', event.threadID, event.messageID);
        const response = await axios.get(`${apiUrl}/sim?type=info`, { timeout: 10000 });
        const totalAsk = response.data?.data?.totalKeys || 0;
        const totalAns = response.data?.data?.totalResponses || 0;
        return shourov.reply({ body: `Total Ask: ${totalAsk}\nTotal Answer: ${totalAns}` }, event.threadID, event.messageID);
      }

      // teach new pair
      if (msg.startsWith("teach")) {
        if (!apiUrl) return shourov.reply('Sim API not available right now.', event.threadID, event.messageID);
        const teachParams = msg.replace("teach", "").trim().split("&");
        const question = (teachParams[0] || "").replace("ask=", "").trim();
        const answer = (teachParams[1] || "").replace("ans=", "").trim();

        const response = await axios.get(`${apiUrl}/sim?type=teach&ask=${encodeURIComponent(question)}&ans=${encodeURIComponent(answer)}`, { timeout: 10000 });
        const replyMessage = response.data?.msg || "";
        const ask = response.data?.data?.ask || question;
        const ans = response.data?.data?.ans || answer;

        if (replyMessage && replyMessage.toString().toLowerCase().includes("already")) {
          return shourov.reply(`📝Your Data Already Added To Database\n1️⃣ASK: ${ask}\n2️⃣ANS: ${ans}`, event.threadID, event.messageID);
        }

        return shourov.reply({ body: `📝Your Data Added To Database Successfully\n1️⃣ASK: ${ask}\n2️⃣ANS: ${ans}` }, event.threadID, event.messageID);
      }

      // askinfo
      if (msg.startsWith("askinfo")) {
        if (!apiUrl) return shourov.reply('Sim API not available right now.', event.threadID, event.messageID);
        const question = msg.replace("askinfo", "").trim();

        if (!question) {
          return shourov.reply('Please provide a question to get information about.', event.threadID, event.messageID);
        }

        const response = await axios.get(`${apiUrl}/sim?type=keyinfo&ask=${encodeURIComponent(question)}`, { timeout: 10000 });
        const replyData = response.data?.data || {};
        const answers = replyData.answers || [];

        if (!answers.length) {
          return shourov.reply(`No information available for the question: "${question}"`, event.threadID, event.messageID);
        }

        const replyMessage = `Info for "${question}":\n\n` +
          answers.map((answer, index) => `📌 ${index + 1}. ${answer}`).join("\n") +
          `\n\nTotal answers: ${answers.length}`;

        return shourov.reply({ body: replyMessage }, event.threadID, event.messageID);
      }

      // help
      if (msg.startsWith("help")) {
        const cmd = this.config.name;
        const prefix = global.config?.PREFIX || "/";
        const helpMessage = `
🌟 Available Commands:

1. ${prefix}${cmd} askinfo [question] - Get information about a specific question.
2. ${prefix}${cmd} teach ask=[question]&ans=[answer] - Teach the bot a new Q&A pair.
3. ${prefix}${cmd} delete ask=[question]&ans=[answer] - Delete a Q&A pair. (Admin only)
4. ${prefix}${cmd} edit old=[old_question]&new=[new_question] - Edit an existing question. (Admin only)
5. ${prefix}${cmd} info - Get total number of questions & answers.
6. ${prefix}${cmd} hi - Send a random greeting.
7. ${prefix}${cmd} textType [type] - Set text type (serif, sans, italic, italic-sans, medieval, normal).
        `;
        return shourov.reply({ body: helpMessage }, event.threadID, event.messageID);
      }

      // default: ask the sim API and reply with styled text
      // (fallback to plain reply if api missing)
      if (!apiUrl) {
        return shourov.reply('Sim API is currently unavailable. Try again later.', event.threadID, event.messageID);
      }

      const response = await axios.get(`${apiUrl}/sim?type=ask&ask=${encodeURIComponent(msg)}`, { timeout: 10000 });
      const replyMessage = response.data?.data?.msg || response.data?.msg || "No response";

      const textStyles = loadTextStyles();
      const userStyle = textStyles[event.threadID]?.style || 'normal';

      const api2 = apiJson?.api2 || null;
      let styledText = replyMessage;
      if (api2) {
        try {
          const font = await axios.get(`${api2}/bold?text=${encodeURIComponent(replyMessage)}&type=${encodeURIComponent(userStyle)}`, { timeout: 8000 });
          styledText = font.data?.data?.bolded || replyMessage;
        } catch (e) {
          styledText = replyMessage;
        }
      }

      shourov.reply({ body: styledText }, event.threadID, (error, info) => {
        if (error) {
          console.error('Error replying to user:', error);
          return shourov.reply('An error occurred while processing your request. Please try again later.', event.threadID, event.messageID);
        }

        global.client = global.client || {};
        global.client.handleReply = global.client.handleReply || [];
        global.client.handleReply.push({
          type: 'reply',
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          head: msg,
        });
      }, event.messageID);

    } catch (error) {
      console.error('Error in start handler:', error && (error.stack || error));
      try { return (shourov && typeof shourov.reply === "function") ? shourov.reply('An error has occurred, please try again later.', event.threadID, event.messageID) : null; } catch (_) {}
    }
  }
};


// utility: load/save text styles per thread
function loadTextStyles() {
  const Path = path.join(__dirname, 'system', 'textStyles.json');
  try {
    if (!fs.existsSync(Path)) {
      fs.mkdirSync(path.dirname(Path), { recursive: true });
      fs.writeFileSync(Path, JSON.stringify({}, null, 2));
    }
    const data = fs.readFileSync(Path, 'utf8');
    return JSON.parse(data || '{}');
  } catch (error) {
    console.error('Error loading text styles:', error);
    return {};
  }
}

function saveTextStyle(threadID, style) {
  const styles = loadTextStyles();
  styles[threadID] = { style };
  const Path = path.join(__dirname, 'system', 'textStyles.json');
  try {
    fs.mkdirSync(path.dirname(Path), { recursive: true });
    fs.writeFileSync(Path, JSON.stringify(styles, null, 2));
  } catch (error) {
    console.error('Error saving text styles:', error);
  }
}