module.exports.config = {
	name: "getlink",
    version: "1.0.1",
    permission: 0,
    credits: "nayan (fixed by shourov)",
    description: "Get the direct URL of an attachment (image/audio/video) by replying to it",
    prefix: true,
    category: "user",
    usages: "reply to a message that contains an image/audio/video",
    cooldowns: 5,
};

module.exports.languages = {
	"vi": {
		"invaidFormat": "❌ Tin nhắn bạn phản hồi phải là một audio, video, ảnh nào đó",
		"tooMany": "❌ Vui lòng reply chỉ một tệp duy nhất."
	},
	"en": {
		"invaidFormat": "❌ You need to reply to a message that contains an audio, video or image.",
		"tooMany": "❌ Please reply to only one attachment."
	},
	"bn": {
		"invaidFormat": "❌ দয়া করে একটি audio, video বা image থাকা মেসেজকে reply করুন।",
		"tooMany": "❌ একসঙ্গে একটির বেশি অ্যাটাচমেন্ট থাকা মেসেজ reply করবেন না।"
	}
};

module.exports.run = async ({ api, event, getText }) => {
	try {
		const lang = (global.config && global.config.language) ? global.config.language : "bn";
		const t = (key) => {
		  // prefer getText if provided by loader, else fallback to our translations
		  if (typeof getText === "function") {
			try { return getText(key); } catch (e) {}
		  }
		  return (module.exports.languages[lang] && module.exports.languages[lang][key]) ||
				 (module.exports.languages['en'] && module.exports.languages['en'][key]) ||
				 "Error";
		};

		// must be reply
		if (event.type !== "message_reply" || !event.messageReply) {
			return api.sendMessage(t("invaidFormat"), event.threadID, event.messageID);
		}

		const atts = event.messageReply.attachments;
		if (!atts || !Array.isArray(atts) || atts.length === 0) {
			return api.sendMessage(t("invaidFormat"), event.threadID, event.messageID);
		}

		if (atts.length > 1) {
			return api.sendMessage(t("tooMany"), event.threadID, event.messageID);
		}

		const att = atts[0];
		// fallback url fields (some loaders/frameworks use different names)
		const url = att.url || att.src || att.mediaUrl || att.attachUrl || null;
		const type = att.type || att.mimeType || att.contentType || "unknown";
		// try to compute filename from url if present
		let filename = "unknown";
		if (url) {
			try {
				const u = String(url);
				const idx = u.lastIndexOf("/");
				filename = idx !== -1 ? decodeURIComponent(u.slice(idx + 1).split("?")[0]) : u;
				if (!filename) filename = "file";
			} catch (e) { filename = "file"; }
		} else if (att.name) {
			filename = att.name;
		}

		// Build nice reply message
		const body = [
			`📥 Attachment info:`,
			`• url      : ${url || "N/A"}`,
			`• filename : ${filename}`,
			`• type     : ${type}`
		].join("\n");

		return api.sendMessage(body, event.threadID, event.messageID);
	} catch (err) {
		console.error("getlink error:", err);
		try { return api.sendMessage("❌ Server error: " + (err.message || err), event.threadID, event.messageID); } catch (e) {}
	}
};