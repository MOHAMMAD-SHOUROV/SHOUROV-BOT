const axios = require('axios');

module.exports.config = { 
  name: "teach",
  version: "0.0.3",
  permission: 0,
  prefix: 'awto',
  credits: "shourov",
  description: "Teach sim (format: ask = answer)",
  category: "admin",
  usages: "hi = hello",
  cooldowns: 5,
};

module.exports.run = async function({ api, event, args, Users }) {
  try {
    const threadID = event.threadID;
    const senderID = event.senderID;
    const raw = args.join(" ").trim();

    if (!raw) {
      return api.sendMessage(`Please enter in the format:\n${global.config.PREFIX}teach ask = answer`, threadID, event.messageID);
    }

    // If user used mention, keep ability to get their name (not required)
    const mentionId = Object.keys(event.mentions || {})[0] || senderID;
    const teacherName = await Users.getNameUser(mentionId).catch(() => null);

    // Ensure the input contains '=' and split only on the first '='
    if (!raw.includes("=")) {
      return api.sendMessage(`Invalid format. Use:\n${global.config.PREFIX}teach ask = answer`, threadID, event.messageID);
    }

    const splitIndex = raw.indexOf("=");
    const askRaw = raw.slice(0, splitIndex).trim();
    const ansRaw = raw.slice(splitIndex + 1).trim();

    if (!askRaw || !ansRaw) {
      return api.sendMessage(`Both ask and answer are required. Example:\n${global.config.PREFIX}teach hi = hello`, threadID, event.messageID);
    }

    // length guards
    const MAX_LEN = 300;
    if (askRaw.length > MAX_LEN || ansRaw.length > MAX_LEN) {
      return api.sendMessage(`Ask/answer too long. Keep each under ${MAX_LEN} characters.`, threadID, event.messageID);
    }

    // load API base from your JSON repo
    const apisRes = await axios.get('https://raw.githubusercontent.com/MOHAMMAD-SHOUROV/shourov/main/api.json');
    const teachBase = apisRes?.data?.sim;
    if (!teachBase) {
      return api.sendMessage("Teach API base URL not found in remote config.", threadID, event.messageID);
    }

    // encode values
    const ask = encodeURIComponent(askRaw);
    const ans = encodeURIComponent(ansRaw);

    const url = `${teachBase}/sim?type=teach&ask=${ask}&ans=${ans}`;

    // perform request
    const res = await axios.get(url, { timeout: 15000 });

    if (res.status >= 200 && res.status < 300) {
      return api.sendMessage({
        body: `📝 Your data was added successfully to the database!\n\n1️⃣ ASK: ${askRaw}\n2️⃣ ANSWER: ${ansRaw}\n\nAdded by: ${teacherName || senderID}`
      }, threadID, event.messageID);
    } else {
      console.error("Teach API returned non-2xx:", res.status, res.data);
      return api.sendMessage("The teach API responded with an error. Try again later.", threadID, event.messageID);
    }

  } catch (error) {
    console.error("teach command error:", error?.response?.data || error.message || error);
    return api.sendMessage("An error occurred while teaching. Please try again later.", event.threadID, event.messageID);
  }
};