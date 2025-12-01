module.exports.config = {
  name: 'admins',
  version: '1.0.1',
  permission: 0,
  credits: 'shourov (fixed)',
  prefix: false,
  description: 'group administrator list.',
  category: 'without prefix',
  usages: 'admins',
  cooldowns: 5,
  dependencies: []
};

module.exports.name = module.exports.config.name;

module.exports.run = async function({ api, event, args, Users }) {
  try {
    const threadID = event.threadID;
    let threadInfo = {};
    try {
      threadInfo = (typeof api.getThreadInfo === 'function') ? await api.getThreadInfo(threadID) : {};
    } catch (e) {
      threadInfo = {};
    }

    const adminArr = Array.isArray(threadInfo.adminIDs) ? threadInfo.adminIDs : [];
    if (adminArr.length === 0) {
      return api.sendMessage("This group has no admins (or I couldn't fetch admin list).", threadID, event.messageID);
    }

    let listad = '';
    let count = 1;

    for (const admin of adminArr) {
      try {
        const id = admin.id || admin; // some APIs return { id: '...' } or direct id
        let name = id;
        if (Users && typeof Users.getNameUser === 'function') {
          try { name = await Users.getNameUser(id); } catch(e) { /* fallback */ }
        } 
        if (!name && typeof api.getUserInfo === 'function') {
          try {
            const info = await api.getUserInfo(id);
            if (info && info[id] && info[id].name) name = info[id].name;
          } catch(e){}
        }
        listad += `${count++}. ${name}\n`;
      } catch (e) {
        listad += `${count++}. ${admin.id || admin}\n`;
      }
    }

    return api.sendMessage(`List of ${adminArr.length} administrator(s):\n\n${listad}`, threadID, event.messageID);
  } catch (err) {
    console.error("admins command error:", err && (err.stack || err));
    try { return api.sendMessage("An error occurred while fetching admin list.", event.threadID); } catch (e) {}
  }
};
