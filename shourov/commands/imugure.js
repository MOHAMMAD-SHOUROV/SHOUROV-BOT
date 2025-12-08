/**
 * imgur.js
 * Adapted for your bot loader style (uses global.nodemodule)
 */

module.exports.config = {
  name: "imgur",
  version: "1.0.1",
  permission: 0,
  credits: "shourov",
  description: "Upload image/video URL(s) to Imgur via external API",
  prefix: true,
  category: "user",
  usages: "imgur <link>  OR  reply to an image/video with: imgur",
  cooldowns: 5,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async ({ api, event, args }) => {
  const axios = global.nodemodule && global.nodemodule["axios"] ? global.nodemodule["axios"] : require("axios");

  try {
    // get url from reply attachment or args
    const attachments = (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length) ? event.messageReply.attachments : null;
    let input = args && args.length ? args.join(" ").trim() : "";

    // collect items to upload: prefer reply attachments if present, else use provided link(s)
    let items = [];
    if (attachments && attachments.length > 0) {
      // use URLs from reply attachments
      attachments.forEach(att => {
        if (att && att.url) items.push(att.url);
      });
    } else if (input) {
      // support multiple urls separated by space or newline
      input.split(/\s+/).forEach(u => {
        if (u) items.push(u);
      });
    }

    if (!items || items.length === 0) {
      return api.sendMessage("[⚜️]➜ ইমেজ/ভিডিও ফাইলটি রেপ্লাই করুন অথবা একটি বৈধ লিংক দিন।\nUsage: imgur <link>  OR reply to an attachment with `imgur`", event.threadID, event.messageID);
    }

    // validate basic URL form and prepare promises
    const bad = items.filter(u => !/^https?:\/\//i.test(u));
    if (bad.length > 0) {
      return api.sendMessage("[⚜️]➜ ভুল URL প্রদান করা হয়েছে: URL অবশ্যই http:// অথবা https:// দিয়ে শুরু করতে হবে।\nInvalid: " + bad.join(", "), event.threadID, event.messageID);
    }

    // fetch API base from remote JSON (same pattern as your other modules)
    let apiBase;
    try {
      const apisResp = await axios.get("https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json", { timeout: 10000 });
      apiBase = apisResp && apisResp.data && apisResp.data.api ? apisResp.data.api : null;
    } catch (e) {
      apiBase = null;
    }

    if (!apiBase) {
      return api.sendMessage("[⚜️]➜ API base পাওয়া যায়নি। Github থেকে api.json ঢুকাতে সমস্যা হয়েছে।", event.threadID, event.messageID);
    }

    // inform user (optional short notice)
    await api.sendMessage("[⚜️]➜ Uploading to Imgur... wait a moment.", event.threadID, event.messageID);

    // call remote endpoint for each item
    const promises = items.map(u => {
      const url = `${apiBase}/imgur?url=${encodeURIComponent(u)}`;
      return axios.get(url, { timeout: 20000 }).then(r => ({ ok: true, data: r.data })).catch(err => ({ ok: false, error: err }));
    });

    const results = await Promise.all(promises);

    // build result message
    const lines = [];
    results.forEach((res, idx) => {
      const original = items[idx];
      if (!res.ok) {
        lines.push(`❌ Failed: ${original}`);
        return;
      }
      const d = res.data;
      // try common response shapes
      if (d && (d.success || d.link || d.data && d.data.link)) {
        // many apis return { success: true, link: "..." } or { data: { link: "..." } }
        const link = d.link || (d.data && d.data.link) || (d.success && d.url) || null;
        const returned = d.link || d.data?.link || d.url || d;
        // prefer link field if exists
        const chosen = d.link || d.data && d.data.link || (typeof d === "string" ? d : null);
        if (chosen) lines.push(`✅ ${original}\n→ ${chosen}`);
        else if (d.link) lines.push(`✅ ${original}\n→ ${d.link}`);
        else if (d.data && d.data.link) lines.push(`✅ ${original}\n→ ${d.data.link}`);
        else lines.push(`✅ ${original}\n→ (uploaded, but no link returned)`);
      } else if (d && d.link) {
        lines.push(`✅ ${original}\n→ ${d.link}`);
      } else {
        // fallback: try find any url-like string in response
        const respText = JSON.stringify(d);
        const m = respText.match(/https?:\/\/[^\s"'}\\]+/);
        if (m) lines.push(`✅ ${original}\n→ ${m[0]}`);
        else lines.push(`❌ ${original}\n→ Upload returned unexpected response.`);
      }
    });

    // send final message
    return api.sendMessage(`[⚜️]➜ Upload results:\n\n${lines.join("\n\n")}`, event.threadID, event.messageID);

  } catch (err) {
    console.error("IMGUR MODULE ERROR:", err);
    return api.sendMessage("[⚜️]➜ ইরর: ইমেজ/ভিডিও আপলোড করার সময় সমস্যা হয়েছে।", event.threadID, event.messageID);
  }
};