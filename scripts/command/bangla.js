module.exports.config = {
    name: "bangla",
    version: "1.0.1",
    permission: 0,
    credits: "Shourov",
    prefix: true,
    description: "Translate any text to Bangla or other languages",
    category: "admin",
    usages: "[text] -> [lang]",
    cooldowns: 5,
    dependencies: {
        "request": ""
    }
};

module.exports.run = async ({ api, event, args }) => {
    const request = global.nodemodule["request"];
    var content = args.join(" ");

    if (content.length == 0 && event.type != "message_reply")
        return global.utils.throwError(this.config.name, event.threadID, event.messageID);

    var translateThis = "";
    var lang = "";

    if (event.type == "message_reply") {
        translateThis = event.messageReply.body;
        lang = content.includes("->") ? content.split("->")[1].trim() : "bn";
    } else if (content.includes(" -> ")) {
        translateThis = content.split(" -> ")[0].trim();
        lang = content.split(" -> ")[1].trim();
    } else {
        translateThis = content;
        lang = "bn"; // Default language Bangla
    }

    return request(
        encodeURI(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${translateThis}`),
        (err, response, body) => {
            if (err) return api.sendMessage("Error translating text.", event.threadID, event.messageID);

            var retrieve = JSON.parse(body);
            var text = retrieve[0].map(item => item[0]).join("");
            var fromLang = retrieve[2];

            api.sendMessage(`Translated from ${fromLang} to ${lang}:\n${text}`, event.threadID, event.messageID);
        }
    );
};
