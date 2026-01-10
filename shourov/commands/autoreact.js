const fs = require("fs-extra");
const path = require("path");

const DATA_DIR = path.join(__dirname, "autoreact");
const DATA_FILE = path.join(DATA_DIR, "status.json");

module.exports.config = {
  name: "autoreact",
  version: "2.0.0",
  permission: 0,
  credits: "shourov",
  description: "Auto react to every group message",
  prefix: true,
  category: "auto",
  usages: "autoreact on/off",
  cooldowns: 3
};

// 🔧 ensure data file
function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ enable: false }, null, 2));
}

// ================= AUTO EVENT =================
module.exports.handleEvent = async ({ api, event }) => {
  try {
    ensureData();

    // শুধু message ইভেন্টে react দেবে
    if (!event.messageID || !event.threadID) return;

    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    if (!data.enable) return;

    // ❌ নিজের bot এর মেসেজে react দিবে না
    if (event.senderID === api.getCurrentUserID()) return;

    const reactions = [
      "❤️","😆","😂","😅","🤭","😎","🔥","🥰","😐","🙄",
      "😳","😜","🤪","🤡","😈","☠️","💀","🗿","👀","🥺"
    ];

    const react = reactions[Math.floor(Math.random() * reactions.length)];

    api.setMessageReaction(
      react,
      event.messageID,
      () => {},
      true
    );

  } catch (err) {
    console.error("[AutoReact] handleEvent error:", err.message);
  }
};

// ================= COMMAND =================
module.exports.run = async ({ api, event, args }) => {
  try {
    ensureData();

    const mode = (args[0] || "").toLowerCase();
    if (!["on", "off"].includes(mode)) {
      return api.sendMessage(
        "⚙️ Usage:\n/autoreact on\n/autoreact off",
        event.threadID,
        event.messageID
      );
    }

    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ enable: mode === "on" }, null, 2)
    );

    return api.sendMessage(
      mode === "on"
        ? "✅ Auto react চালু করা হয়েছে"
        : "❌ Auto react বন্ধ করা হয়েছে",
      event.threadID,
      event.messageID
    );

  } catch (err) {
    console.error("[AutoReact] run error:", err.message);
    return api.sendMessage(
      "⚠️ Auto react সেট করতে সমস্যা হয়েছে",
      event.threadID
    );
  }
};