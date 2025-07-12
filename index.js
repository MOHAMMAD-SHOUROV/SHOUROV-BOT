const path = require("path");
const fs = require("fs-extra");
const chalk = require("chalk");
const login = require("fca-unofficial");

// === Load Global Config ===
global.config = require("./config/config.json");

// === Check & Convert Cookie to Appstate if needed ===
const cookiePath = path.join(__dirname, "config", "appstate.json");
(async () => {
  const raw = fs.readFileSync(cookiePath, "utf-8").trim();
  if (!raw.startsWith("[")) {
    console.log(chalk.yellow("🔄 Cookie detected. Converting to appstate..."));
    const convert = require("./utils/cookieToAppstate");
    await convert(cookiePath);
  }

  // === Load AppState ===
  const appState = require(cookiePath);

  // === Login to Facebook ===
  login({ appState }, async (err, api) => {
    if (err) return console.error(chalk.red("[❌] Login Failed:"), err);
    console.log(chalk.green("[SHOUROV-BOT] Login Successful!"));

    // ====== এখানে সব গ্রুপ থ্রেড আইডি লোড কর ======
    api.getThreadList(100, null, ["INBOX"], (err, data) => {
      if (err) return console.error("Error loading thread list:", err);
      global.data = global.data || {};
      global.data.allThreadID = data
        .filter(thread => thread.isGroup && thread.threadID)
        .map(thread => thread.threadID);
      console.log(`[SHOUROV-BOT] Loaded ${global.data.allThreadID.length} group thread IDs`);
    });
    // ================================================

    // === Global Variables ===
    global.api = api;
    global.commands = new Map();
    global.events = new Map();

    // === Bot Settings ===
    api.setOptions({
      listenEvents: true,
      selfListen: false,
      logLevel: "silent"
    });

    // === Load Commands ===
    const commandPath = path.join(__dirname, "scripts", "commands");
    const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {
      try {
        const command = require(path.join(commandPath, file));
        if (command.config?.name) {
          global.commands.set(command.config.name, command);
          console.log(chalk.blue(`[SHOUROV-BOT] Loaded command: ${command.config.name}`));
        }
      } catch (err) {
        console.error(chalk.red(`[SHOUROV-BOT] Error loading command ${file}:`), err);
      }
    }

    // === Load Events ===
    const eventPath = path.join(__dirname, "scripts", "events");
    const eventFiles = fs.readdirSync(eventPath).filter(file => file.endsWith(".js"));
    for (const file of eventFiles) {
      try {
        const event = require(path.join(eventPath, file));
        if (event.config?.name && typeof event.run === "function") {
          global.events.set(event.config.name, event);
          await event.run({ api, event: null }); // Auto-run events
          console.log(chalk.yellow(`[SHOUROV-BOT] Loaded event: ${event.config.name}`));
        }
      } catch (err) {
        console.error(chalk.red(`[SHOUROV-BOT] Error loading event ${file}:`), err);
      }
    }

    // === Listen to Messages ===
    api.listen(async (err, event) => {
      if (err) return console.error(chalk.red("[SHOUROV-BOT] Listen Error:"), err);
      if (!["message", "message_reply"].includes(event.type)) return;

      const body = event.body || "";
      const prefix = global.config.PREFIX || "/";

      if (body.startsWith(prefix)) {
        const args = body.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        const command = global.commands.get(cmdName);
        if (command && typeof command.run === "function") {
          try {
            await command.run({ api, event, args });
          } catch (err) {
            console.error(chalk.red(`[SHOUROV-BOT] Error in command "${cmdName}":`), err);
            api.sendMessage("❌ কমান্ড চালাতে সমস্যা হয়েছে!", event.threadID);
          }
        }
      }

      // === handleEvent (No-Prefix) Commands ===
      for (const [name, cmd] of global.commands) {
        if (typeof cmd.handleEvent === "function") {
          try {
            await cmd.handleEvent({ api, event });
          } catch (err) {
            console.error(chalk.red(`[SHOUROV-BOT] Error in handleEvent of "${name}":`), err);
          }
        }
      }
    });
  });
})();
