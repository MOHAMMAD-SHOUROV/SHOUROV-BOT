module.exports = {
  config: {
    name: "ai",
    version: "1.0.0",
    permission: 0,
    credits: "shourov",
    description: "",
    prefix: true,
    category: "user",
    usages: "query",
    cooldowns: 5,
    dependencies: {}
  },

  start: async function({ api, event, args, Users }) {
    const axios = require("axios");
    try {
      const uid = event.senderID;
      const np = args.join(" ");

      // আপনার কনফিগ URL থেকে API লিংক নিচ্ছে
      const apis = await axios.get('https://shourov-api-config.onrender.com');
      const apiss = apis.data.api;

      // এখানে OpenAI API থেকে রেসপন্স নিচ্ছে
      const response = await axios.get(`${apiss}/shourov/ai?prompt=${encodeURIComponent(np)}`);

      const aiResponse = response.data.response || 'I am unable to process your request at the moment.';

      // রেসপন্স মেসেজ সেন্ড করবে
      return api.sendMessage(aiResponse, event.threadID, event.messageID);
    } catch (error) {
      console.error("Error while processing GPT request:", error);
      return api.sendMessage("⚠️ Request এ সমস্যা হয়েছে। আবার চেষ্টা করুন।", event.threadID, event.messageID);
    }
  }
};