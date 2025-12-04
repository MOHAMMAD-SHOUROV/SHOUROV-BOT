const axios = require('axios');
const fs = require('fs'); 
const path = require('path');

module.exports = {
  config: {
    name: "bot",
    version: "1.0.0",
    aliases: ["mim"],
    permission: 0,
    credits: "shourov()",
    description: "talk with bot",
    prefix: 3,
    category: "talk",
    usages: "hi",
    cooldowns: 5,
  },

  handleReply: async function ({ api, event }) {
    try {
      const apiData = await axios.get('https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json');
      const apiUrl = apiData.data.sim;
      const kl = await axios.get('https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json');
      const apiUrl2 = kl.data.api2;

      const response = await axios.get(`${apiUrl}/sim?type=ask&ask=${encodeURIComponent(event.body)}`);
      const result = response.data?.data?.msg || response.data?.msg || "No response";

      const textStyles = loadTextStyles();
      const userStyle = textStyles[event.threadID]?.style || 'normal'; 

      const fontResponse = await axios.get(`${apiUrl2}/bold?text=${encodeURIComponent(result)}&type=${encodeURIComponent(userStyle)}`);
      const text = fontResponse.data?.data?.bolded || result;

      api.sendMessage(text, event.threadID, (error, info) => {
        if (error) {
          console.error('Error replying to user:', error);
          return api.sendMessage('An error occurred while processing your request. Please try again later.', event.threadID, event.messageID);
        }
        global.client.handleReply.push({
          type: 'reply',
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          head: event.body
        });
      }, event.messageID);

    } catch (error) {
      console.error('Error in handleReply:', error);
      api.sendMessage('An error occurred while processing your request. Please try again later.', event.threadID, event.messageID);
    }
  },

  start: async function ({ shourov, event, args, Users }) {
    try {
      const msg = args.join(" ").trim();
      const apiData = await axios.get('https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json');
      const apiUrl = apiData.data.sim;

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
        const name = await Users.getNameUser(event.senderID);
        const rand = greetings[Math.floor(Math.random() * greetings.length)];

        return shourov.reply({
          body: `${name}, ${rand}`,
          mentions: [{ tag: name, id: event.senderID }]
        }, event.threadID, (error, info) => {
          if (error) {
            return shourov.reply('An error occurred while processing your request. Please try again later.', event.threadID, event.messageID);
          }

          global.client.handleReply.push({
            type: 'reply',
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            head: msg,
          });
        }, event.messageID);
      }

      // set text style for this thread
      else if (msg.startsWith("textType")) {
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
      else if (msg.startsWith("delete")) {
        const deleteParams = msg.replace("delete", "").trim().split("&");
        const question = (deleteParams[0] || "").replace("ask=", "").trim();
        const answer = (deleteParams[1] || "").replace("ans=", "").trim();

        const d = await axios.get(`${apiUrl}/sim?type=delete&ask=${encodeURIComponent(question)}&ans=${encodeURIComponent(answer)}&uid=${event.senderID}`);
        const replyMessage = d.data?.msg || d.data?.data?.msg || "No response";
        return shourov.reply({ body: replyMessage }, event.threadID, event.messageID);
      }

      // edit question
      else if (msg.startsWith("edit")) {
        const editParams = msg.replace("edit", "").trim().split("&");
        const oldQuestion = (editParams[0] || "").replace("old=", "").trim();
        const newQuestion = (editParams[1] || "").replace("new=", "").trim();

        const d = await axios.get(`${apiUrl}/sim?type=edit&old=${encodeURIComponent(oldQuestion)}&new=${encodeURIComponent(newQuestion)}&uid=${event.senderID}`);
        const replyMessage = d.data?.msg || d.data?.data?.msg || "No response received.";
        return shourov.reply({ body: replyMessage }, event.threadID, event.messageID);
      }

      // info stats
      else if (msg.startsWith("info")) {
        const response = await axios.get(`${apiUrl}/sim?type=info`);
        const totalAsk = response.data?.data?.totalKeys || 0;
        const totalAns = response.data?.data?.totalResponses || 0;
        return shourov.reply({ body: `Total Ask: ${totalAsk}\nTotal Answer: ${totalAns}` }, event.threadID, event.messageID);
      } 

      // teach new pair
      else if (msg.startsWith("teach")) {
        const teachParams = msg.replace("teach", "").trim().split("&");
        const question = (teachParams[0] || "").replace("ask=", "").trim();
        const answer = (teachParams[1] || "").replace("ans=", "").trim();

        const response = await axios.get(`${apiUrl}/sim?type=teach&ask=${encodeURIComponent(question)}&ans=${encodeURIComponent(answer)}`);
        const replyMessage = response.data?.msg || "";
        const ask = response.data?.data?.ask || question;
        const ans = response.data?.data?.ans || answer;

        if (replyMessage && replyMessage.toString().toLowerCase().includes("already")) {
          return shourov.reply(`📝Your Data Already Added To Database\n1️⃣ASK: ${ask}\n2️⃣ANS: ${ans}`, event.threadID, event.messageID);
        }

        return shourov.reply({ body: `📝Your Data Added To Database Successfully\n1️⃣ASK: ${ask}\n2️⃣ANS: ${ans}` }, event.threadID, event.messageID);
      } 

      // askinfo
      else if (msg.startsWith("askinfo")) {
        const question = msg.replace("askinfo", "").trim();

        if (!question) {
          return shourov.reply('Please provide a question to get information about.', event.threadID, event.messageID);
        }

        const response = await axios.get(`${apiUrl}/sim?type=keyinfo&ask=${encodeURIComponent(question)}`);
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
      else if (msg.startsWith("help")) {
        const cmd = this.config.name;
        const prefix = global.config.PREFIX || "/";
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
      else {
        const response = await axios.get(`${apiUrl}/sim?type=ask&ask=${encodeURIComponent(msg)}`);
        const replyMessage = response.data?.data?.msg || response.data?.msg || "No response";

        const textStyles = loadTextStyles();
        const userStyle = textStyles[event.threadID]?.style || 'normal';

        const kl2 = await axios.get('https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json');
        const apiUrl2 = kl2.data.api2;

        const font = await axios.get(`${apiUrl2}/bold?text=${encodeURIComponent(replyMessage)}&type=${encodeURIComponent(userStyle)}`);
        const styledText = font.data?.data?.bolded || replyMessage;

        shourov.reply({ body: styledText }, event.threadID, (error, info) => {
          if (error) {
            return shourov.reply('An error occurred while processing your request. Please try again later.', event.threadID, event.messageID);
          }

          global.client.handleReply.push({
            type: 'reply',
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            head: msg,
          });
        }, event.messageID);
      }
    } catch (error) {
      console.log(error);
      try {
        return (shourov && typeof shourov.reply === "function") 
          ? shourov.reply('An error has occurred, please try again later.', event.threadID, event.messageID)
          : null;
      } catch (e) { /* ignore */ }
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
    return JSON.parse(data);  
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
    fs.writeFileSync(Path, JSON.stringify(styles, null, 2));
  } catch (error) {
    console.error('Error saving text styles:', error);
  }
}