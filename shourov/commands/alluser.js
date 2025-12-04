module.exports.config = {
    name: "alluser",
    version: "1.0.6",
    permission: 0,
    prefix: false,
    credits: "shourov",
    description: "Get all users info in this group",
    category: "without prefix",
    cooldowns: 2
};

module.exports.run = async function ({ api, event, Users }) {
    try {
        const members = event.participantIDs;
        let msg = "👥 ALL USERS IN THIS GROUP 👥\n\n";
        let index = 1;

        for (const uid of members) {
            let name;

            try {
                name = await Users.getNameUser(uid);
            } catch {
                name = "Unknown User";
            }

            msg += `${index}. ${name}\n`;
            msg += `🆔 UID: ${uid}\n`;
            msg += `🔗 Link: https://facebook.com/${uid}\n\n`;

            index++;
        }

        return api.sendMessage(msg, event.threadID, event.messageID);

    } catch (e) {
        console.log(e);
        return api.sendMessage("⚠️ Something went wrong while fetching users.", event.threadID);
    }
};
