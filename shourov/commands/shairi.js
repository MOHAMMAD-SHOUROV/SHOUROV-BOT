module.exports.config = {
	name: "shairi", 
  version: "1.0.0", 
  permission: 0,
  credits: "shourov",
  description: "Random shairi video",
  prefix: true,
  category: "Media", 
  usages: "", 
  cooldowns: 5,
  dependencies: {
    "request":"",
    "fs-extra":"",
    "fs":""
  }
};

const videoDATA = "https://5025dd35-d3b6-4e53-8f7e-b40e5488f9dc-00-2xr6zjnwy871b.global.replit.dev/video/shairi";

module.exports.onLoad = ({}) => {
  if (!global.nodemodule["fs"].existsSync(__dirname + '/shourov')) {
    global.nodemodule["fs"].mkdirSync(__dirname + '/shourov');
  }
  global.nodemodule["fs"].readdirSync(__dirname + '/shourov').forEach(file => {
    global.nodemodule["fs"].unlinkSync(__dirname + `/shourov/${file}`);
  })
}

module.exports.run = async ({ api, event }) => {
  global.nodemodule["axios"]
    .get(videoDATA)
    .then(res => {
      global.nodemodule["axios"]
        .get(encodeURI(res.data.data), { responseType: "arraybuffer" })
        .then(ress => {
          let path = __dirname + `/shourov/${Date.now()}.mp4`;
          global.nodemodule["fs"].writeFileSync(path, Buffer.from(ress.data, 'utf-8'));
          api.sendMessage({
            body: "☆《SHAIRI》☆",
            attachment: global.nodemodule["fs"].createReadStream(path)
          }, event.threadID, () => global.nodemodule["fs"].unlinkSync(path), event.messageID);
          return;
        })
        .catch(e => {
          api.sendMessage("Something went wrong...", event.threadID, event.messageID);
          return;
        });
    })
  .catch(e => {
    api.sendMessage("Something went wrong...", event.threadID, event.messageID);
    return;
  });

  return;
}
