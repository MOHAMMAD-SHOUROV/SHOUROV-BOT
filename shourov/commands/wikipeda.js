module.exports.config = {
	name: "wiki",
	version: "1.0.1",
	permission: 0,
	credits: "ryuko",
	prefix: false,
	description: "wikipedia search",
	category: "without prefix",
	usages: "[en] [question]",
	cooldowns: 1,
	dependencies: {
        "wikijs": ""
    }
}

module.exports.languages = {
    "vi": {
        "missingInput": "Nội dung cần tìm kiếm không được để trống!",
        "returnNotFound": "Không tìm thấy nội dung %1"
    },
    "en": {
        "missingInput": "enter what you need to search for.",
        "returnNotFound": "can't find %1"
    }
}

module.exports.run = async ({ event, args, api, getText }) => {
    try {
        const wiki = (global.nodemodule["wikijs"]).default;
        let content = args.join(" ").trim();
        let url = 'https://en.wikipedia.org/w/api.php';

        if (args[0] && args[0].toLowerCase() === "en") {
            // "en" flag থাকলে আগেরটা বাদ দিয়ে পরেরগুলোকে ব্যবহার করুন
            content = args.slice(1).join(" ").trim();
            url = 'https://en.wikipedia.org/w/api.php';
        }

        if (!content) return api.sendMessage(getText("missingInput"), event.threadID, event.messageID);

        const page = await wiki({ apiUrl: url }).page(content).catch(()=>null);
        if (!page) return api.sendMessage(getText("returnNotFound", content), event.threadID, event.messageID);

        const summary = await page.summary();
        return api.sendMessage(summary || getText("returnNotFound", content), event.threadID, event.messageID);
    } catch (err) {
        console.error("WIKI ERROR:", err);
        return api.sendMessage("Server error: " + (err.message || err), event.threadID, event.messageID);
    }
};
