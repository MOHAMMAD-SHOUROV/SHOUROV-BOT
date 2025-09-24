const fs = require("fs-extra");
const request = require("request");
const path = __dirname + "/cache/1.png";

module.exports.config = {
    name: "avt",
    version: "1.0.1",
    permission: 0,
    credits: "Shourov",
    description: "Get Facebook avatar",
    prefix: true,
    category: "user",
    usages: "",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args, Threads }) {
    if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache");

    const threadSetting = (await Threads.getData(String(event.threadID))).data || {};
    const prefix = threadSetting.PREFIX || global.config.PREFIX;
    const mn = this.config.name;

    if (!args[0]) return api.sendMessage(
        `[🔰] FB-AVATAR [🔰]\n\nUsage:\n→ ${prefix}${mn} box\n→ ${prefix}${mn} id [uid]\n→ ${prefix}${mn} link [profile link]\n→ ${prefix}${mn} user [@mention]`,
        event.threadID,
        event.messageID
    );

    const sendImage = (url, bodyMsg) => {
        return request(encodeURI(url))
            .pipe(fs.createWriteStream(path))
            .on("close", () => {
                api.sendMessage({ body: bodyMsg, attachment: fs.createReadStream(path) }, event.threadID, () => fs.unlinkSync(path), event.messageID);
            });
    };

    if (args[0] == "box") {
        const threadID = args[1] || event.threadID;
        let threadInfo = await api.getThreadInfo(threadID);
        if (!threadInfo.imageSrc) return api.sendMessage(`No avatar for box ${threadInfo.threadName}`, event.threadID, event.messageID);
        return sendImage(threadInfo.imageSrc, `Avatar of box ${threadInfo.threadName}`);
    }
    else if (args[0] == "id") {
        const uid = args[1];
        if (!uid) return api.sendMessage("Enter a UID to get avatar.", event.threadID, event.messageID);
        return sendImage(`https://graph.facebook.com/${uid}/picture?height=720&width=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, "User Avatar");
    }
    else if (args[0] == "link") {
        const link = args[1];
        if (!link) return api.sendMessage("Enter profile link.", event.threadID, event.messageID);
        const uidMatch = link.match(/(?:facebook\.com\/)([a-zA-Z0-9\.]+)/);
        if (!uidMatch) return api.sendMessage("Invalid link.", event.threadID, event.messageID);
        const username = uidMatch[1];
        return sendImage(`https://graph.facebook.com/${username}/picture?height=720&width=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, `Avatar from link ${username}`);
    }
    else if (args[0] == "user") {
        const id = args[1] ? Object.keys(event.mentions)[0] : event.senderID;
        return sendImage(`https://graph.facebook.com/${id}/picture?height=720&width=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, "User Avatar");
    }
    else {
        return api.sendMessage(`Wrong usage! Use ${prefix}${mn}`, event.threadID, event.messageID);
    }
};
