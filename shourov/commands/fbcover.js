const path = require("path");

module.exports.config = {
  name: "fbcover",
  version: "1.0.1",
  permssion: 0,
  credits: "Mohammad Nayan (adapted by Shourov)",
  description: "Generate FB cover from inputs",
  category: "fbcover",
  prefix: true,
  cooldowns: 2,
  dependencies: {}
};

module.exports.run = async function({ api, event, args, Users }) {
  // use global.nodemodule if available to match loader style
  const axios = (global.nodemodule && global.nodemodule["axios"]) ? global.nodemodule["axios"] : require("axios");
  const fs = (global.nodemodule && global.nodemodule["fs-extra"]) ? global.nodemodule["fs-extra"] : require("fs-extra");
  const jimp = (global.nodemodule && global.nodemodule["jimp"]) ? global.nodemodule["jimp"] : require("jimp");

  const { threadID, messageID, senderID, mentions } = event;
  const uid = senderID;
  const input = args.join(" ").trim();

  if (!input) {
    return api.sendMessage(
      "ব্যবহার: fbcover name - subname - address - email - phone - color\nউদাহরণ:\nfbcover John Doe - Developer - Dhaka - john@mail.com - +8801xxxxxxx - #ffffff",
      threadID,
      messageID
    );
  }

  // parse fields split by '-'
  const parts = input.split("-").map(p => p.trim());
  // ensure at least 5 parts (name, subname, address, email, phone). color optional.
  if (parts.length < 5) {
    return api.sendMessage("অনুগ্রহ করে কমপক্ষে 5 টি ক্ষেত্র দিন:\nname - subname - address - email - phone - color(optional)", threadID, messageID);
  }

  const name = parts[0] || "";
  const subname = parts[1] || "";
  const address = parts[2] || "";
  const email = parts[3] || "";
  const phone = parts[4] || "";
  const color = parts[5] || ""; // optional

  // pick target id (if someone tagged, use first mention else sender)
  const targetId = Object.keys(mentions || {})[0] || senderID;
  let displayName = targetId;
  try {
    if (Users && typeof Users.getNameUser === "function") {
      displayName = await Users.getNameUser(targetId);
    }
  } catch (e) {
    // keep id if name fetch fails
    displayName = targetId;
  }

  // notify user
  let waitingMsg;
  try {
    waitingMsg = await api.sendMessage("Processing FB cover... ⏳", threadID);
  } catch (e) {
    // ignore
  }

  // prepare cache dir and file
  const cacheDir = path.join(__dirname, "cache");
  try { fs.ensureDirSync(cacheDir); } catch (e) {}
  const outFile = path.join(cacheDir, `fbcover_${uid}_${Date.now()}.png`);

  try {
    // fetch api base url from remote list (same as original)
    const apisResp = await axios.get("https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json", { timeout: 15000 });
    const n = apisResp && apisResp.data && apisResp.data.api ? apisResp.data.api : "";

    if (!n) throw new Error("API base URL not found.");

    const imageUrl = `${n}/fbcover/v1?name=${encodeURIComponent(name)}&uid=${encodeURIComponent(targetId)}&address=${encodeURIComponent(address)}&email=${encodeURIComponent(email)}&subname=${encodeURIComponent(subname)}&sdt=${encodeURIComponent(phone)}&color=${encodeURIComponent(color)}`;

    const resp = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 30000 });
    // jimp read and save as png to normalize
    const img = await jimp.read(Buffer.from(resp.data, "binary"));
    await img.writeAsync(outFile);

    const bodyText =
`◆━━━━━━━━◆◆━━━━━━━━◆
🔴 NAME: ${name}
🔵 SUBNAME: ${subname}
📊 ADDRESS: ${address}
✉️ EMAIL: ${email}
☎️ PHONE: ${phone}
🎨 COLOR: ${color || "default"}
🆔 PROFILE: ${displayName}
◆━━━━━━━━◆◆━━━━━━━━◆`;

    await api.sendMessage({
      body: bodyText,
      attachment: fs.createReadStream(outFile)
    }, threadID, (err) => {
      // cleanup after send
      try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch (e) {}
      // unsend waiting message
      try { if (waitingMsg && waitingMsg.messageID) api.unsendMessage(waitingMsg.messageID); } catch (e) {}
    }, messageID);

  } catch (err) {
    console.error("fbcover error:", err && (err.stack || err.message || err));
    try { if (waitingMsg && waitingMsg.messageID) api.unsendMessage(waitingMsg.messageID); } catch (e) {}
    return api.sendMessage("FB cover তৈরি করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।\nError: " + (err.message || err), threadID, messageID);
  }
};