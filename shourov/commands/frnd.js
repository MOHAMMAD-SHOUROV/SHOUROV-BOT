module.exports.config = {
    name: "friends",
    version: "1.0.0",
    permission: 3,
    credits: "ryuko",
    description: "list friends",
    prefix: true,
    category: "operator",
    usages: "friends",
    cooldowns: 5,
};

module.exports.handleReply = async function ({ api, args, Users, handleReply, event, Threads, getText }) {
  const { threadID, messageID } = event;
  if (parseInt(event.senderID) !== parseInt(handleReply.author)) return;

  switch (handleReply.type) {
    case "reply":
      {
        var msg ="" , name, urlUser, uidUser;
        var arrnum = event.body.split(" ");
        var nums = arrnum.map(n => parseInt(n));
        for (let num of nums) {
          name = handleReply.nameUser[num - 1];
          urlUser = handleReply.urlUser[num - 1];
          uidUser = handleReply.uidUser[num - 1];

          api.unfriend(uidUser);
          msg += 'name : ' + name + '\nlink : ' + urlUser + "\n";
          //console.log(msg);
        }

        api.sendMessage(`successfully deleted from friend list\n\n${msg}`, threadID, () =>
          api.unsendMessage(handleReply.messageID));
      }
      break;
  }
};

