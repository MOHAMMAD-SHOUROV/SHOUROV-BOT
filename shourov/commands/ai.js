
const axios = require("axios");

module.exports.config = {
  name: "bot",
  version: "2.3.2",
  credits: "Mahabub (fixed for Mirai by ChatGPT)",
  description: "Chat with AI like SimSimi (with teach, delete, edit & info features)",
  prefix: false,
  category: "fun",
  usages: "[message]",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID } = event;
  const query = args.join(" ").trim();

  try {
    // Load API config
    const { data } = await axios.get("https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json");
    const apiUrl = data?.sim;
    const apiUrl2 = data?.api2;
    const userName = (await Users.getNameUser(senderID)) || "User";

    if (!apiUrl)
      return api.sendMessage("⚠️ Bot API not found, please check configuration.", threadID, messageID);

    // No message → greeting
    if (!query) {
      const greetings = [
        "Hello, how can I help you today?",
        "Hi there! Ask me anything.",
        "Hey, let's chat!",
        "Greetings!",
        "I'm ready to talk, ask me a question."
      ];
      const rand = greetings[Math.floor(Math.random() * greetings.length)];
      return api.sendMessage(`「 ${userName} 」\n\n${rand}`, threadID, messageID);
    }

    // === Command sections ===
    if (query.startsWith("teach")) {
      const params = query.replace("teach", "").trim().split("&");
      const ask = params[0]?.replace("ask=", "").trim();
      const ans = params[1]?.replace("ans=", "").trim();
      if (!ask || !ans)
        return api.sendMessage("⚠️ Format: teach ask=[q]&ans=[a]", threadID, messageID);

      const res = await axios.get(`${apiUrl}/sim?type=teach&ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}`);
      const msg = res.data?.msg || "No response.";
      const rdata = res.data?.data;
      return api.sendMessage(
        msg.includes("already")
          ? `📝 Already exists!\nAsk: ${rdata?.ask}\nAns: ${rdata?.ans}`
          : `✅ Added Successfully!\nAsk: ${rdata?.ask}\nAns: ${rdata?.ans}`,
        threadID, messageID
      );
    }

    if (query.startsWith("delete")) {
      const params = query.replace("delete", "").trim().split("&");
      const ask = params[0]?.replace("ask=", "").trim();
      const ans = params[1]?.replace("ans=", "").trim();
      if (!ask || !ans)
        return api.sendMessage("⚠️ Format: delete ask=[q]&ans=[a]", threadID, messageID);

      const res = await axios.get(`${apiUrl}/sim?type=delete&ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}&uid=${senderID}`);
      return api.sendMessage(res.data?.msg || "✅ Deleted successfully!", threadID, messageID);
    }

    if (query.startsWith("edit")) {
      const params = query.replace("edit", "").trim().split("&");
      const oldQ = params[0]?.replace("old=", "").trim();
      const newQ = params[1]?.replace("new=", "").trim();
      if (!oldQ || !newQ)
        return api.sendMessage("⚠️ Format: edit old=[q]&new=[new]", threadID, messageID);

      const res = await axios.get(`${apiUrl}/sim?type=edit&old=${encodeURIComponent(oldQ)}&new=${encodeURIComponent(newQ)}&uid=${senderID}`);
      return api.sendMessage(res.data?.msg || "✏️ Edited successfully!", threadID, messageID);
    }

    if (query === "info") {
      const res = await axios.get(`${apiUrl}/sim?type=info`);
      return api.sendMessage(
        `📊 Total Ask: ${res.data?.data?.totalKeys}\n📊 Total Ans: ${res.data?.data?.totalResponses}`,
        threadID, messageID
      );
    }

    if (query.startsWith("askinfo")) {
      const question = query.replace("askinfo", "").trim();
      if (!question)
        return api.sendMessage("⚠️ Please provide a question.", threadID, messageID);

      const res = await axios.get(`${apiUrl}/sim?type=keyinfo&ask=${encodeURIComponent(question)}`);
      const answers = res.data?.data?.answers || [];
      if (!answers.length)
        return api.sendMessage(`❌ No info for "${question}"`, threadID, messageID);

      const msg = `ℹ️ Info for "${question}":\n${answers.map((ans, i) => `📌 ${i + 1}. ${ans}`).join("\n")}\n\nTotal answers: ${answers.length}`;
      return api.sendMessage(msg, threadID, messageID);
    }

    // === Normal Chat ===
    const res = await axios.get(`${apiUrl}/sim?type=ask&ask=${encodeURIComponent(query)}`);
    let reply = res.data?.data?.msg || "🤔 I don't know how to respond to that.";

    try {
      if (apiUrl2) {
        const font = await axios.get(`${apiUrl2}/bold?text=${encodeURIComponent(reply)}&type=serif`);
        if (font.data?.data?.bolded) reply = font.data.data.bolded;
      }
    } catch (e) {
      // Ignore styling errors
    }

    api.sendMessage(reply, threadID, (err, info) => {
      if (!err) {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID
        });
      }
    }, messageID);

  } catch (err) {
    console.error("Bot error:", err);
    return api.sendMessage("⚠️ Something went wrong, try again later.", event.threadID, event.messageID);
  }
};

// === Reply Handler ===
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  if (handleReply.author !== senderID) return;

  try {
    const { data } = await axios.get("https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json");
    const apiUrl = data?.sim;
    const apiUrl2 = data?.api2;

    const res = await axios.get(`${apiUrl}/sim?type=ask&ask=${encodeURIComponent(body)}`);
    let reply = res.data?.data?.msg || "No reply found.";

    try {
      if (apiUrl2) {
        const font = await axios.get(`${apiUrl2}/bold?text=${encodeURIComponent(reply)}&type=serif`);
        if (font.data?.data?.bolded) reply = font.data.data.bolded;
      }
    } catch (e) {}

    api.sendMessage(reply, threadID, (err, info) => {
      if (!err) {
        global.client.handleReply.push({
          name: "bot",
          messageID: info.messageID,
          author: senderID
        });
      }
    }, messageID);

  } catch (e) {
    console.error("Reply error:", e);
    api.sendMessage("⚠️ Error while replying.", threadID, messageID);
  }
};
