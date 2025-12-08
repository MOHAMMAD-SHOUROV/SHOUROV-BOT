module.exports.config = {
    name: "wiki",
    version: "1.1.0",
    permission: 0,
    credits: "ryuko (fixed by shourov)",
    prefix: false,
    description: "Wikipedia search (BN + EN auto)",
    category: "without prefix",
    usages: "wiki [bn/en] query",
    cooldowns: 1,
    dependencies: { "wikijs": "" }
};

module.exports.languages = {
    "vi": {
        "missingInput": "Nội dung cần tìm kiếm không được để trống!",
        "returnNotFound": "Không tìm thấy nội dung %1"
    },
    "en": {
        "missingInput": "enter what you need to search for.",
        "returnNotFound": "can't find %1"
    },
    "bn": {
        "missingInput": "অনুগ্রহ করে সার্চ করার বিষয় লিখুন।",
        "returnNotFound": "%1 সম্পর্কে কিছু পাওয়া যায়নি।"
    }
};

module.exports.run = async ({ event, args, api, getText }) => {
    try {
        const wiki = (global.nodemodule["wikijs"]).default;

        if (!args[0]) 
            return api.sendMessage(getText("missingInput"), event.threadID, event.messageID);

        // -------------------------------
        // LANGUAGE DETECT & CLEAN QUERY
        // -------------------------------
        let lang = "bn"; // default Bangla
        let content = args.join(" ").trim();

        if (args[0].toLowerCase() === "en") {
            lang = "en";
            content = args.slice(1).join(" ").trim();
        } else if (args[0].toLowerCase() === "bn") {
            lang = "bn";
            content = args.slice(1).join(" ").trim();
        }

        if (!content)
            return api.sendMessage(getText("missingInput"), event.threadID, event.messageID);

        // -------------------------------
        // API URL SELECT
        // -------------------------------
        const apiUrl = (lang === "en") 
            ? "https://en.wikipedia.org/w/api.php"
            : "https://bn.wikipedia.org/w/api.php";

        // -------------------------------
        // FETCH WIKIPEDIA DATA
        // -------------------------------
        const page = await wiki({ apiUrl }).page(content).catch(() => null);

        if (!page)
            return api.sendMessage(getText("returnNotFound", content), event.threadID, event.messageID);

        const summary = await page.summary();

        if (!summary || summary.length < 5)
            return api.sendMessage(getText("returnNotFound", content), event.threadID, event.messageID);

        return api.sendMessage(summary, event.threadID, event.messageID);

    } catch (err) {
        console.error("WIKI ERROR:", err);
        return api.sendMessage("⚠️ Wikipedia server error: " + (err.message || err), event.threadID, event.messageID);
    }
};