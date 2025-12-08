module.exports.config = {
	name: "react",
	version: "1.0.1",
	permission: 2,
	credits: "shourov",
	description: "React to a post by ID",
	prefix: true,
	category: "admin",
	usages: "[postID] <reaction type>: (unlike/like/love/heart/haha/wow/sad/angry)",
	cooldowns: 1
};

module.exports.run = async ({ api, event, args }) => {
	try {
		const allType = ["unlike","like","love","heart","haha","wow","sad","angry"];
		if (!args || args.length < 2) {
			return api.sendMessage(`Usage: ${global.config.PREFIX}react [postID] [type]\nTypes: ${allType.join("/")}`, event.threadID, event.messageID);
		}

		let postID = args[0].toString().trim();
		const type = args[1].toString().trim().toLowerCase();

		// Basic postID sanitization: remove non-digit characters (keep - for shared ids if any)
		postID = postID.replace(/[^\d\-]/g, "");
		if (!postID) return api.sendMessage("Invalid postID.", event.threadID, event.messageID);

		if (!allType.includes(type)) {
			return api.sendMessage(`The reaction type is not valid. Choose one: ${allType.join("/")}`, event.threadID, event.messageID);
		}

		// try to call API (some libs accept Number, some accept string)
		const numericId = isNaN(Number(postID)) ? postID : Number(postID);

		api.setPostReaction(numericId, type, (err) => {
			if (err) {
				console.error("setPostReaction error:", err);
				return api.sendMessage("Something went wrong. Check your postID and permissions, then try again.", event.threadID, event.messageID);
			}
			return api.sendMessage(`✅ Reaction '${type}' applied to post ID ${postID}`, event.threadID, event.messageID);
		});
	} catch (e) {
		console.error(e);
		return api.sendMessage("An unexpected error occurred.", event.threadID, event.messageID);
	}
};