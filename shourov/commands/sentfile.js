// sendfile.js — Fully compatible with Shourov Loader

module.exports.config = {
    name: "sendfile",
    version: "1.1.0",
    permission: 2,
    prefix: true,
    credits: "Optimized by Shourov",
    description: "Send any command file to user or group",
    category: "admin",
    usages: "sendfile <filename>.js",
    cooldowns: 5,
};

module.exports.run = async ({ args, api, event, Users }) => {
    const allowed = ["100071971474157"]; // Only owner
    if (!allowed.includes(event.senderID))
        return api.sendMessage("[❗] Only Permission User Can Use This Command", event.threadID, event.messageID);

    const fs = require("fs-extra");
    const stringSimilarity = require("string-similarity");

    const file = args.join(" ").trim();
    if (!file) return api.sendMessage("❌ File name cannot be empty.", event.threadID, event.messageID);
    if (!file.endsWith(".js")) return api.sendMessage("❌ File must be a `.js` file.", event.threadID, event.messageID);

    const fullPath = __dirname + "/" + file;

    // User Reply Mode
    if (event.type === "message_reply") {
        const uid = event.messageReply.senderID;
        const name = (await Users.getData(uid)).name || "User";

        // If file doesn't exist → suggest closest file
        if (!fs.existsSync(fullPath)) {
            const all = fs.readdirSync(__dirname).filter(f => f.endsWith(".js")).map(f => f.replace(".js", ""));
            const checker = stringSimilarity.findBestMatch(file.replace(".js", ""), all);
            if (!checker.bestMatch.target)
                return api.sendMessage(`❌ File not found: ${file}`, event.threadID, event.messageID);

            return api.sendMessage(
                `❌ File not found: ${file}\n👉 Did you mean: ${checker.bestMatch.target}.js?\nReact to send.`,
                event.threadID,
                (err, info) => {
                    global.client.handleReaction.push({
                        name: module.exports.config.name,
                        type: "send_to_user",
                        author: event.senderID,
                        messageID: info.messageID,
                        file: checker.bestMatch.target,
                        uid,
                        name
                    });
                },
                event.messageID
            );
        }

        // Send file
        const txtPath = fullPath.replace(".js", ".txt");
        fs.copyFileSync(fullPath, txtPath);

        return api.sendMessage(
            { body: `📦 File: ${file}`, attachment: fs.createReadStream(txtPath) },
            uid,
            () => fs.unlinkSync(txtPath)
        ).then(() => {
            api.sendMessage(`📨 Sent file to ${name}`, event.threadID);
        });
    }

    // Group Mode (no reply)
    if (!fs.existsSync(fullPath)) {
        const all = fs.readdirSync(__dirname).filter(f => f.endsWith(".js")).map(f => f.replace(".js", ""));
        const checker = stringSimilarity.findBestMatch(file.replace(".js", ""), all);

        if (!checker.bestMatch.target)
            return api.sendMessage(`❌ File not found: ${file}`, event.threadID, event.messageID);

        return api.sendMessage(
            `❌ File not found: ${file}\n👉 Closest match: ${checker.bestMatch.target}.js\nReact to send.`,
            event.threadID,
            (err, info) => {
                global.client.handleReaction.push({
                    name: module.exports.config.name,
                    type: "send_to_thread",
                    author: event.senderID,
                    messageID: info.messageID,
                    file: checker.bestMatch.target,
                });
            },
            event.messageID
        );
    }

    // Send normally
    const txtPath = fullPath.replace(".js", ".txt");
    fs.copyFileSync(fullPath, txtPath);

    return api.sendMessage(
        { body: `📦 File: ${file}`, attachment: fs.createReadStream(txtPath) },
        event.threadID,
        () => fs.unlinkSync(txtPath)
    );
};

// ========= HANDLE REACTION ========= //

module.exports.handleReaction = async ({ api, event, handleReaction }) => {
    const fs = require("fs-extra");
    const { file, author, type, uid, name } = handleReaction;

    if (event.userID !== author) return;

    const fileName = file + ".js";
    const fullPath = __dirname + "/" + fileName;
    const txtPath = fullPath.replace(".js", ".txt");

    if (!fs.existsSync(fullPath))
        return api.sendMessage("❌ File no longer exists.", event.threadID);

    fs.copyFileSync(fullPath, txtPath);

    api.unsendMessage(handleReaction.messageID);

    // Send to user (reply mode)
    if (type === "send_to_user") {
        return api.sendMessage(
            { body: `📦 File: ${fileName}`, attachment: fs.createReadStream(txtPath) },
            uid,
            () => fs.unlinkSync(txtPath)
        ).then(() => {
            api.sendMessage(`📨 Sent file to ${name}`, event.threadID);
        });
    }

    // Send to thread
    if (type === "send_to_thread") {
        return api.sendMessage(
            { body: `📦 File: ${fileName}`, attachment: fs.createReadStream(txtPath) },
            event.threadID,
            () => fs.unlinkSync(txtPath)
        );
    }
};