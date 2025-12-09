module.exports.config = {
    name: "avt",
    version: "1.0.0",
    permission: 0,
    credits: "Nayan | Fixed by shourov",
    description: "Get avatar of user, UID, box, link",
    prefix: true,
    category: "user",
    usages: "",
    cooldowns: 5,
};

module.exports.run = async function ({ api, event, args, Threads }) {

    const request = require("request");
    const fs = require("fs-extra");
    const axios = require("axios");

    const threadSetting = (await Threads.getData(String(event.threadID))).data || {};
    const prefix = (threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : global.config.PREFIX;
    const mn = this.config.name;

    // HELP MENU
    if (!args[0]) return api.sendMessage(
        `[🔰] FB AVATAR TOOL 🔰]

[📌] Box Avatar:
→ ${prefix}${mn} box

[📌] Avatar by UID:
→ ${prefix}${mn} id <uid>

[📌] Avatar by Link:
→ ${prefix}${mn} link <fb link>

[📌] User Avatar (self):
→ ${prefix}${mn} user

[📌] User Avatar (mention):
→ ${prefix}${mn} user @tag`,
        event.threadID, event.messageID
    );

    // BOX
    if (args[0].toLowerCase() == "box") {

        let threadID = args[1] || event.threadID;
        let threadInfo = await api.getThreadInfo(threadID);
        let img = threadInfo.imageSrc;

        if (!img) return api.sendMessage(`⚠️ This box has no avatar.`, event.threadID);

        let callback = () => api.sendMessage(
            { body: `📦 Box Avatar: ${threadInfo.threadName}`, attachment: fs.createReadStream(__dirname + "/cache/box.png") },
            event.threadID,
            () => fs.unlinkSync(__dirname + "/cache/box.png")
        );

        return request(encodeURI(img))
            .pipe(fs.createWriteStream(__dirname + "/cache/box.png"))
            .on("close", () => callback());
    }

    // UID
    if (args[0].toLowerCase() == "id") {
        let id = args[1];
        if (!id) return api.sendMessage(`⚠️ Please provide a UID.`, event.threadID);

        let callback = () => api.sendMessage(
            { attachment: fs.createReadStream(__dirname + "/cache/uid.png") },
            event.threadID,
            () => fs.unlinkSync(__dirname + "/cache/uid.png")
        );

        return request(
            encodeURI(`https://graph.facebook.com/${id}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)
        )
            .pipe(fs.createWriteStream(__dirname + "/cache/uid.png"))
            .on("close", () => callback());
    }

    // LINK
    if (args[0].toLowerCase() == "link") {

        let link = args[1];
        if (!link) return api.sendMessage(`⚠️ Please provide a Facebook link.`, event.threadID);

        const tool = require("fb-tools");
        try {
            let id = await tool.findUid(link);

            let callback = () => api.sendMessage(
                { attachment: fs.createReadStream(__dirname + "/cache/link.png") },
                event.threadID,
                () => fs.unlinkSync(__dirname + "/cache/link.png")
            );

            return request(
                encodeURI(`https://graph.facebook.com/${id}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)
            )
                .pipe(fs.createWriteStream(__dirname + "/cache/link.png"))
                .on("close", () => callback());

        } catch (e) {
            return api.sendMessage("❌ User not found!", event.threadID);
        }
    }

    // USER
    if (args[0].toLowerCase() == "user") {

        let id;

        if (!args[1]) id = event.senderID; // self avatar
        else if (Object.keys(event.mentions).length > 0) id = Object.keys(event.mentions)[0]; // tag avatar
        else return api.sendMessage(`❌ Wrong command.`, event.threadID);

        let callback = () => api.sendMessage(
            { attachment: fs.createReadStream(__dirname + "/cache/user.png") },
            event.threadID,
            () => fs.unlinkSync(__dirname + "/cache/user.png")
        );

        return request(
            encodeURI(`https://graph.facebook.com/${id}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)
        )
            .pipe(fs.createWriteStream(__dirname + "/cache/user.png"))
            .on("close", () => callback());
    }

    return api.sendMessage(`❌ Wrong usage. Type: ${prefix}${mn}`, event.threadID);
};