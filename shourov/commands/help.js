module.exports.run = async function({ api, event, args, getText }) {
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  const path = require("path");
  const { commands } = global.client;
  const { threadID, messageID } = event;

  // Config: যদি চান এখানে কাস্টমাইজ করুন
  const OWNER_ID = (global.config && (global.config.OWNER_ID || (global.config.ADMIN && Array.isArray(global.config.ADMIN) && global.config.ADMIN[0]))) || "100071971474157";
  const OWNER_NAME = (global.config && global.config.OWNER_NAME) || "AlIHSAN SHOUROV";
  const OWNER_PROFILE = (global.config && global.config.OWNER_FB) || `https://www.facebook.com/shourov.sm24`;
  const avatarCache = path.join(__dirname, "cache", "owner_avatar.jpg");

  // module config (for autoUnsend)
  const moduleCfg = (global.configModule && global.configModule[this.config.name]) || {};
  const autoUnsend = Boolean(moduleCfg.autoUnsend);
  const delayUnsend = Number(moduleCfg.delayUnsend) || 60; // seconds

  // prefix detection
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = (threadSetting && threadSetting.PREFIX) ? threadSetting.PREFIX : (global.config && global.config.PREFIX) || "/";

  // If user asked for single command details: show detailed info (backwards compatible)
  const maybeCmd = (args[0] || "").toLowerCase();
  if (maybeCmd && commands.has(maybeCmd)) {
    const cmd = commands.get(maybeCmd);
    const permText = (cmd.config.hasPermssion == 0) ? getText("user") : (cmd.config.hasPermssion == 1) ? getText("adminGroup") : getText("adminBot");
    const detailMsg = getText("moduleInfo",
      cmd.config.name,
      cmd.config.description || "No description",
      `${prefix}${cmd.config.name} ${(cmd.config.usages) ? cmd.config.usages : ""}`,
      cmd.config.category || cmd.config.commandCategory || "N/A",
      cmd.config.cooldowns || "0",
      permText,
      cmd.config.credits || "Unknown"
    );
    return api.sendMessage(detailMsg, threadID, messageID);
  }

  // Build commands list (sorted)
  const list = [];
  for (const [name, mod] of commands) {
    const usage = mod.config.usages ? ` ${mod.config.usages}` : "";
    list.push({ name, display: `${name}${usage}` });
  }
  list.sort((a,b) => a.name.localeCompare(b.name));

  // paging
  const page = Math.max(1, parseInt(args[0]) || 1);
  const perPage = 10;
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const pageItems = list.slice(start, start + perPage);

  // pretty list text
  let msgList = `╭─── 『 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗟𝗜𝗦𝗧 』 ───╮\n`;
  let counter = start;
  for (const it of pageItems) {
    counter++;
    msgList += `│ ${counter}. ${prefix}${it.display}\n`;
  }
  msgList += `╰─────────────────────╯\n\n`;

  // find .js files in common module dirs (customize candidateDirs if your loader uses another folder)
  const candidateDirs = [
    path.join(process.cwd(), "modules"),
    path.join(process.cwd(), "commands"),
    path.join(process.cwd(), "commands", "modules"),
    path.join(__dirname, ".."),
    process.cwd()
  ];

  let jsFiles = [];
  for (const d of candidateDirs) {
    try {
      if (!d) continue;
      if (!fs.existsSync(d)) continue;
      const walk = (dir) => {
        const items = fs.readdirSync(dir);
        for (const f of items) {
          const full = path.join(dir, f);
          try {
            const stat = fs.lstatSync(full);
            if (stat.isDirectory()) walk(full);
            else if (stat.isFile() && f.endsWith(".js")) jsFiles.push(path.relative(process.cwd(), full));
          } catch(e) { /* ignore file errors */ }
        }
      };
      walk(d);
    } catch(e) { /* ignore */ }
    if (jsFiles.length) break;
  }
  if (!jsFiles.length) {
    // fallback: list current directory js files
    try { jsFiles = fs.readdirSync(__dirname).filter(f => f.endsWith(".js")).map(f => path.join(path.relative(process.cwd(), __dirname), f)); } catch(e) { jsFiles = []; }
  }

  const showFiles = jsFiles.slice(0, 40);
  const filesBlock = showFiles.length ? showFiles.join("\n") + (jsFiles.length > 40 ? `\n...and ${jsFiles.length - 40} more` : "") : "No .js module files found";

  // prepare final stylish message (with owner info)
  const header = `╔════════════════════════╗\n║    ✦ 𝗕𝗢𝗧 𝗛𝗘𝗟𝗣 𝗠𝗘𝗡𝗨 ✦    ║\n╚════════════════════════╝\n\n`;
  const ownerBlock = `👑 Owner : ${OWNER_NAME}\n🆔 ID   : ${OWNER_ID}\n🔗 Profile: ${OWNER_PROFILE}\n\n`;
  const footer = `\n• Total Commands: ${total}\n• Page: ${page}/${totalPages}\n\n-- Modules (.js) --\n${filesBlock}\n\nPowered by: ${global.config.BOTNAME || "Your Bot"}\n`;

  const finalText = header + ownerBlock + msgList + footer;

  // download owner avatar (facebook graph) and attach (best-effort)
  try {
    // ensure cache dir
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    // download avatar (public)
    const graphUrl = `https://graph.facebook.com/${OWNER_ID}/picture?height=720&width=720`;
    const resp = await axios.get(graphUrl, { responseType: "arraybuffer", timeout: 15000 });
    await fs.writeFile(avatarCache, Buffer.from(resp.data));

    // send with attachment
    await api.sendMessage({ body: finalText, attachment: fs.createReadStream(avatarCache) }, threadID, async (err, info) => {
      // cleanup avatar file
      try { if (fs.existsSync(avatarCache)) fs.unlinkSync(avatarCache); } catch(e) {}
      if (autoUnsend && info && info.messageID) {
        // delayUnsend in seconds -> convert to ms
        await new Promise(r => setTimeout(r, delayUnsend * 1000));
        try { await api.unsendMessage(info.messageID); } catch(e) {}
      }
    }, messageID);

  } catch (err) {
    // if avatar attach fails, just send text
    console.warn("Owner avatar download failed:", err && err.message);
    await api.sendMessage(finalText, threadID, messageID);
  }
};