module.exports.config = {
  name: "eval",
  aliases: ["ev", "e"],
  version: "1.0.1",
  permission: 2,
  credits: "NAYAN (Hardcoded by Shourov)",
  prefix: "awto",
  description: "Run JS code (only owner)",
  category: "admin",
  usages: "awtoeval <js code>",
  cooldowns: 0
};

const util = require("util");

function shortText(s, max = 1900) {
  if (typeof s !== "string") s = String(s);
  if (s.length <= max) return s;
  return s.slice(0, max - 12) + "\n\n...(truncated)";
}

module.exports.run = async function ({ api, event, args }) {

  // ============================
  // 🔒 HARD CODED OWNER CHECK
  // ============================
  const OWNER_ID = "100071971474157";
  if (event.senderID !== OWNER_ID) {
    return api.sendMessage(
      "❌ Only Shourov Boss can use this command!",
      event.threadID,
      event.messageID
    );
  }

  if (!args || args.length === 0) {
    return api.sendMessage("Usage: awtoeval <JavaScript code>", event.threadID, event.messageID);
  }

  const code = args.join(" ");
  const wrapped = `(async (api,event,global,require,process,console) => { 
      try {
        ${code}
      } catch (err) { throw err }
  })`;

  let fn;
  try {
    fn = eval(wrapped);
  } catch (err) {
    return api.sendMessage(
      "❌ Eval compile error:\n" + shortText(err.stack || err),
      event.threadID,
      event.messageID
    );
  }

  try {
    const result = await fn(api, event, global, require, process, console);
    let output = typeof result === "string"
      ? result
      : util.inspect(result, { depth: 2 });

    const msg = `✅ Result:\n\`\`\`\n${shortText(output)}\n\`\`\``;
    return api.sendMessage(msg, event.threadID, event.messageID);

  } catch (err) {
    const message = `❌ Runtime error:\n\`\`\`\n${shortText(err.stack || err)}\n\`\`\``;
    return api.sendMessage(message, event.threadID, event.messageID);
  }
};