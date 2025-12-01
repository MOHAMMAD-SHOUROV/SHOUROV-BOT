module.exports.config = {
    name: "command",
    version: "1.0.1",
    permission: 2,
    credits: "shourov (fixed)",
    description: "Manage/control all bot modules",
    prefix: true,
    category: "operator",
    usages: "[load/unload/loadAll/unloadAll/info] [command name]",
    cooldowns: 5,
    dependencies: {
        "fs-extra": "",
        "child_process": "",
        "path": ""
    }
};

const loadModule = async ({ api, moduleList, threadID, messageID }) => {
    const { execSync } = global.nodemodule["child_process"];
    const { writeFileSync, unlinkSync, readFileSync } = global.nodemodule["fs-extra"];
    const { join } = global.nodemodule["path"];
    const { configPath, mainPath } = global.client;

    let logger = require(mainPath + '/shourovc.js');
    let errorList = [];

    delete require.cache[require.resolve(configPath)];
    let configValue = require(configPath);

    writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 2));

    for (const mod of moduleList) {
        try {
            const modPath = __dirname + "/" + mod + ".js";
            delete require.cache[require.resolve(modPath)];

            const command = require(modPath);

            if (!command.config || !command.run)
                throw new Error("Invalid module format");

            global.client.commands.delete(mod);

            // load dependencies
            if (command.config.dependencies) {
                const pkgJson = JSON.parse(readFileSync("./package.json"));
                const builtin = require("module").builtinModules;

                for (let pkg in command.config.dependencies) {
                    try {
                        if (pkg in pkgJson.dependencies || builtin.includes(pkg))
                            global.nodemodule[pkg] = require(pkg);
                        else
                            throw new Error("not found");
                    } catch {
                        logger.loader(`Installing missing package '${pkg}' for module '${mod}'`, "warn");

                        execSync(`npm --save install ${pkg}`, {
                            stdio: "inherit",
                            shell: true,
                            cwd: join(global.client.mainPath, "nodemodules")
                        });

                        global.nodemodule[pkg] = require(pkg);
                    }
                }
                logger.loader(`Loaded dependencies for ${mod}`);
            }

            // register module
            global.client.commands.set(command.config.name, command);
            if (command.handleEvent)
                global.client.eventRegistered.push(command.config.name);

            logger.loader(`Loaded: ${mod}`);

        } catch (err) {
            errorList.push(`${mod} → ${err.message}`);
        }
    }

    writeFileSync(configPath, JSON.stringify(configValue, null, 4));
    unlinkSync(configPath + ".temp");

    if (errorList.length)
        api.sendMessage("⚠️ Error modules:\n" + errorList.join("\n"), threadID, messageID);

    return api.sendMessage(`✅ Loaded ${moduleList.length - errorList.length} modules.`, threadID, messageID);
};

const unloadModule = async ({ api, moduleList, threadID, messageID }) => {
    const { writeFileSync, unlinkSync } = global.nodemodule["fs-extra"];
    const { configPath, mainPath } = global.client;

    let logger = require(mainPath + "/shourovc.js").loader;

    delete require.cache[require.resolve(configPath)];
    let configValue = require(configPath);

    writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 4));

    for (let mod of moduleList) {
        global.client.commands.delete(mod);
        global.client.eventRegistered = global.client.eventRegistered.filter(x => x !== mod);

        configValue.commandDisabled.push(mod + ".js");
        global.config.commandDisabled.push(mod + ".js");

        logger(`Unloaded: ${mod}`);
    }

    writeFileSync(configPath, JSON.stringify(configValue, null, 4));
    unlinkSync(configPath + ".temp");

    return api.sendMessage(`❎ Unloaded ${moduleList.length} modules.`, threadID, messageID);
};

module.exports.run = async function ({ api, event, args }) {
    const { readdirSync } = global.nodemodule["fs-extra"];
    const { threadID, messageID } = event;

    const action = args[0];
    let moduleList = args.slice(1);

    if (!["load", "unload", "loadAll", "unloadAll", "info"].includes(action))
        return api.sendMessage("❗ Invalid syntax!", threadID, messageID);

    switch (action) {
        case "load":
            if (!moduleList.length) return api.sendMessage("❗ Module name required!", threadID, messageID);
            return loadModule({ api, moduleList, threadID, messageID });

        case "unload":
            if (!moduleList.length) return api.sendMessage("❗ Module name required!", threadID, messageID);
            return unloadModule({ api, moduleList, threadID, messageID });

        case "loadAll":
            moduleList = readdirSync(__dirname).filter(f => f.endsWith(".js")).map(f => f.replace(".js", ""));
            return loadModule({ api, moduleList, threadID, messageID });

        case "unloadAll":
            moduleList = readdirSync(__dirname)
                .filter(f => f.endsWith(".js") && f !== "command.js")
                .map(f => f.replace(".js", ""));
            return unloadModule({ api, moduleList, threadID, messageID });

        case "info": {
            const mod = moduleList.join("");
            const cmd = global.client.commands.get(mod);

            if (!cmd) return api.sendMessage("❗ Module not found!", threadID, messageID);

            const info =
                `📌 NAME: ${cmd.config.name}\n` +
                `👤 AUTHOR: ${cmd.config.credits}\n` +
                `⚡ VERSION: ${cmd.config.version}\n` +
                `🔐 PERMISSION: ${cmd.config.permission}\n` +
                `⏱️ COOLDOWN: ${cmd.config.cooldowns}\n` +
                `📦 DEPENDENCIES: ${Object.keys(cmd.config.dependencies || {}).join(", ") || "none"}`;

            return api.sendMessage(info, threadID, messageID);
        }
    }
};
