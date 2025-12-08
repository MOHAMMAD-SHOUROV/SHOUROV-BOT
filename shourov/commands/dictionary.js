module.exports.config = {
  name: "dictionary",
  version: "1.0.1",
  permssion: 0,
  prefix: true,
  credits: "Nayan (fixed by Shourov)",
  description: "English word meaning finder",
  usage: "[word]",
  category: "study",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const axios = require("axios");
  const { threadID, messageID } = event;

  if (!args[0]) 
    return api.sendMessage("⚠️ Please enter a word to search.\nExample: /dictionary love", threadID, messageID);

  const word = args.join(" ").trim().toLowerCase();

  try {
    const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data = res.data[0];

    let phonetics = "";
    if (data.phonetics && data.phonetics.length > 0) {
      phonetics = data.phonetics
        .filter(p => p.text)
        .map(p => `/${p.text}/`)
        .join(", ");
    }

    let meaningsText = "";
    data.meanings.forEach((item, index) => {
      const definition = item.definitions[0].definition || "No definition found";
      const example = item.definitions[0].example
        ? `\n   👉 Example: "${item.definitions[0].example}"`
        : "";

      meaningsText += `\n${index + 1}. (${item.partOfSpeech})\n   ➤ ${definition}${example}\n`;
    });

    const finalMessage = 
`📘 Dictionary Result  
─────────────────────
🔎 **Word:** ${data.word}

🎧 **Pronunciation:** ${phonetics || "N/A"}

📚 **Meanings:**  
${meaningsText}

Powered by: DictionaryAPI.dev`;

    return api.sendMessage(finalMessage, threadID, messageID);

  } catch (err) {
    if (err.response && err.response.status === 404) {
      return api.sendMessage("❌ No Definitions Found For This Word.", threadID, messageID);
    }
    return api.sendMessage("❌ API Error, Please try again later.", threadID, messageID);
  }
};