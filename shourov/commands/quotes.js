const axios = require("axios");

module.exports.config = {
    name: "quotes",
    version: "1.0.0",
    permission: 0, // want everyone to use? keep 0, else set to 2
    credits: "shourov",
    description: "Random motivational quotes",
    prefix: false, 
    category: "without prefix",
    usages: "quotes",
    cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
    try {
        const res = await axios.get("https://api.quotable.io/random");

        if (!res.data || !res.data.content) {
            return api.sendMessage(
                "⚠️ API did not return any quote.",
                event.threadID,
                event.messageID
            );
        }

        const quote = res.data.content;
        const author = res.data.author || "Unknown";

        const msg = `💬 𝗥𝗮𝗻𝗱𝗼𝗺 𝗤𝘂𝗼𝘁𝗲\n\n“${quote}”\n\n— ${author}`;

        return api.sendMessage(msg, event.threadID, event.messageID);

    } catch (err) {
        console.error("Quote API Error:", err.message);
        return api.sendMessage(
            "⚠️ Something went wrong while fetching quotes.",
            event.threadID,
            event.messageID
        );
    }
};