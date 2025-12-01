module.exports.config = {
  name: "alluser",
  version: "1.0.6",
  permission: 0,
  prefix: false,
  credits: "shourov",
  description: "Get all uid and names in Group.",
  category: "without prefix",
  cooldowns: 2
};

module.exports.name = module.exports.config.name;

module.exports.run = async function ({ api, event, args, Users }) {
  try {
    const threadID = event.threadID;
    // try thread participants from event first, else fetch thread info
    let participantIDs = Array.isArray(event.participantIDs) ? event.participantIDs : (Array.isArray(event.participantIDs) ? event.participantIDs : null);

    if (!participantIDs || participantIDs.length === 0) {
      try {
        const info = (typeof api.getThreadInfo === 'function') ? await api.getThreadInfo(threadID) : null;
        participantIDs = (info && Array.isArray(info.participantIDs)) ? info.participantIDs : (info && info.userInfo ? info.userInfo.map(u => u.id) : []);
      } catch (e) {
        participantIDs = [];
      }
    }

    if (!participantIDs || participantIDs.length === 0) {
      return api.sendMessage("Could not fetch participant list for this group.", threadID, event.messageID);
    }

    let lines = [];
    let counter = 0;

    for (const id of participantIDs) {
      counter++;
      let name = id;
      try {
        if (Users && typeof Users.getNameUser === 'function') {
          name = await Users.getNameUser(id) || id;
        } else if (typeof api.getUserInfo === 'function') {
          const info = await api.getUserInfo(id);
          if (info && info[id] && info[id].name) name = info[id].name;
        }
      } catch (e) {
        name = id;
      }

      lines.push(`${counter}. ${name}\nUID: ${id}\nLink: https://facebook.com/${id}\n`);
    }

    // chunk message to avoid length limits
    const CHUNK_SIZE = 1500;
    let chunk = "";
    for (const line of lines) {
      if ((chunk + line).length > CHUNK_SIZE) {
        await api.sendMessage(`All users in this group:\n\n${chunk}`, threadID, event.messageID);
        chunk = line;
      } else {
        chunk += line;
      }
    }
    if (chunk.length) {
      await api.sendMessage(`All users in this group:\n\n${chunk}`, threadID, event.messageID);
    }

  } catch (err) {
    console.error("alluser error:", err && (err.stack || err));
    try { return api.sendMessage("An error occurred while fetching users.", event.threadID); } catch (e) {}
  }
};
