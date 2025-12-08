module.exports.config = {
	name: "run",
	version: "1.0.2",
	permission: 3,
	prefix: false,
	credits: "Mirai Team",
	description: "Execute JS code (owner-only). Use with caution!",
	category: "system",
	usages: "[Script]",
	cooldowns: 5,
	dependencies: {
		"eval": ""
	}
};

module.exports.run = async function({ api, event, args, Threads, Users, Currencies, models, global }) {
	// NOTE: This command executes arbitrary JavaScript. Only allow trusted users to run it.
	const evalModule = require("eval");

	const sendOutput = async (data) => {
		try {
			let out = "";

			if (data === null) out = "null";
			else if (typeof data === "undefined") out = "undefined";
			else if (data instanceof Error) out = data.stack || data.message;
			else if (typeof data === "function") out = data.toString();
			else if (typeof data === "object" || Array.isArray(data)) {
				try {
					out = JSON.stringify(data, null, 4);
				} catch (e) {
					out = String(data);
				}
			} else out = String(data);

			// truncate if too long
			const MAX_LEN = 1900;
			if (out.length > MAX_LEN) out = out.slice(0, MAX_LEN) + "\n...output truncated...";

			// wrap in codeblock for readability if multiline
			const body = out.includes("\n") ? "Result:\n" + "```\n" + out + "\n```" : "Result:\n" + out;
			return api.sendMessage(body, event.threadID, event.messageID);
		} catch (err) {
			try { return api.sendMessage("Error sending output: " + err.message, event.threadID, event.messageID); }
			catch(e){ console.error("Failed to send output:", e); }
		}
	};

	// build a safe-ish context object for eval
	const context = {
		api, event, args, Threads, Users, Currencies, models, global,
		console, require, setTimeout, setInterval, clearInterval, clearTimeout, URL
	};

	// join code
	const code = args.join(" ");
	if (!code) return api.sendMessage("No script provided.", event.threadID, event.messageID);

	try {
		// evalModule returns the exported result (supports async if code uses top-level await)
		const result = await evalModule(code, { sandbox: context, async: true, filename: "run-eval" });
		return await sendOutput(result);
	} catch (error) {
		return await sendOutput(error);
	}
};