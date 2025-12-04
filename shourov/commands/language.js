const fs = require("fs");

module.exports.config = {
    name: "language",
    version: "2.0.0",
    permission: 0,
    prefix: true,
    credits: "shourov (fixed & styled)",
    description: "Change bot language",
    category: "admin",
    usages: "language vi | en",
    cooldowns: 3
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;

    // operator check
    const OPERATORS = global.config.OPERATOR || [];
    if (!OPERATORS.includes(senderID.toString())) {
        return api.sendMessage(
            "⚠️ Only **bot operators** can use this command!",
            threadID,
            messageID
        );
    }

    if (!args[0]) {
        return api.sendMessage(
            "❗ Usage: language **vi** | **en**",
            threadID,
            messageID
        );
    }

    const choice = args[0].toLowerCase();
    const configPath = global.client.configPath;

    switch (choice) {
        case "vi":
        case "viet":
        case "vietnam":
        case "vietnamese": {
            global.config.language = "vi";

            // save to config.json
            fs.writeFileSync(configPath, JSON.stringify(global.config, null, 2));

            return api.sendMessage(
                "🌐 Bot language successfully changed to **Vietnamese (VI)**",
                threadID,
                messageID
            );
        }

        case "en":
        case "eng":
        case "english": {
            global.config.language = "en";

            // save to config.json
            fs.writeFileSync(configPath, JSON.stringify(global.config, null, 2));

            return api.sendMessage(
                "🌐 Bot language successfully changed to **English (EN)**",
                threadID,
                messageID
            );
        }

        default:
            return api.sendMessage(
                "❗ Invalid option!\nUse: language **vi** or **en**",
                threadID,
                messageID
            );
    }
};