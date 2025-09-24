const axios = require("axios");

module.exports = {
    name: "anicouple",
    description: "Send random anime couple photo",
    execute: async ({ api, message }) => {
        try {
            // Random anime couple image API (example)
            const res = await axios.get("https://api.waifu.pics/sfw/waifu");
            const imageUrl = res.data.url;

            // Send image
            api.sendMessage(
                {
                    body: "💖 Anime Couple 💖",
                    attachment: await global.utils.getStreamFromURL(imageUrl),
                },
                message.threadID,
                message.messageID
            );
        } catch (err) {
            api.sendMessage("❌ Error loading anime couple image!", message.threadID);
        }
    }
};
