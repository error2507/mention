const Discord = require("discord.js"),
    client = new Discord.Client({ disabledEveryone: true }),
    config = require("./config"),
    roles = require("./roles"),
    { check } = require("./structures/PermissionChecker"),
    { addrole } = require("./cmds/addrole");

// Cooldowns (maybe useless, bc recode)
let cooldowns = {};

/**
 * ready event
 */

client.on("ready", async () => {
    console.log(`${client.user.username}#${client.user.discriminator} is ready. ${roles.list.length} roles loaded.`);
    client.user.setActivity('your roles', {type: 'WATCHING'});
});

/**
 * message event (RECODE plz kthxbye)
 */

client.on('message', async (message) => {
    if (message.content.startsWith(config.prefix)) {
        let cmd = message.content.split(' ')[0].substr(config.prefix.length).toLowerCase();
        switch (cmd) {
            case 'addrole':
                addrole(message);
        }
    } else {
        let permsMissing = false
        if (message.channel.type == 'text' && message.author.id != client.user.id) {
            let rolesToMention = [];
            for(i = 0; i < roles.list.length; i++) {
                if (!(message.webhookID)) {
                    if (!(message.author.bot)) {
                        if (message.content.toUpperCase().includes('@' + message.guild.roles.get(roles.list[i].id).name.toUpperCase())) {
                            let mentionRole = message.guild.roles.get(roles.list[i].id)
                            if (!(cooldowns[message.author.id]) || !(cooldowns[message.author.id].includes(mentionRole.id))) {
                                missingPerms = await check(message.guild)
                                if (missingPerms.length == 0) {
                                    rolesToMention.push(mentionRole);
                                } else {
                                    permsMissing = true;
                                }
                            }
                        }
                    }
                }
            }
            if (permsMissing) {
                message.channel.send(`I need the following perms to work properly: \`\`\`https\n${missingPerms.join(",\n")}\`\`\``);
            }

            if (rolesToMention.length != 0) {
                message.channel.send(`Do you really want to mention following roles?\n${rolesToMention.map(r => '**' + r.name + '**').join('\n')}`).then(async askmessage => {
                    await askmessage.react('✅');
                    await askmessage.react('❌');
                    const filter = (reaction, user) => (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id
                    askmessage.awaitReactions(filter, { time: 10000, max: 1}).then(async collected => {
                        askmessage.delete();
                        if (collected.size == 1) {
                            if (collected.first().emoji == '✅') {
                                message.delete();
                                let text = message.content.toUpperCase().split(' ');
                                let textToSend = message.content.split(' ');
                                for(r = 0; r < rolesToMention.length; r++) {
                                    if (message.content.toUpperCase().includes(rolesToMention[r].name.toUpperCase())) {
                                        for(w = 0; w < text.length; w++) {
                                            if (text[w].startsWith('@')) {
                                                let withoutAt = await text[w].substr(1, text[w].length)
                                                if (withoutAt.toUpperCase() == rolesToMention[r].name.toUpperCase()) {
                                                    textToSend[w] = rolesToMention[r].toString();
                                                    //Adding Cooldown
                                                    for(i = 0; i < roles.list.length; i++) {
                                                        if (roles.list[i].id == rolesToMention[r].id) {
                                                            if (cooldowns[message.author.id]) {
                                                                await cooldowns[message.author.id].push(rolesToMention[r].id);
                                                                let idToRemoveIndex = await cooldowns[message.author.id].length - 1;
                                                                setTimeout(function() {
                                                                    cooldowns[message.author.id].splice(idToRemoveIndex, 1);
                                                                }, roles.list[i].cooldown * 1000);
                                                            } else {
                                                                function cooldownArrayCreate() {
                                                                    cooldowns[message.author.id] = [rolesToMention[r].id];
                                                                }
                                                                await cooldownArrayCreate();
                                                                let idToRemoveIndex = await cooldowns[message.author.id].length - 1;
                                                                setTimeout(function() {
                                                                    cooldowns[message.author.id].splice(idToRemoveIndex, 1);
                                                                }, roles.list[i].cooldown * 1000)
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                message.channel.createWebhook(message.member.displayName, message.author.displayAvatarURL).then(async wh => {
                                    await rolesToMention.map(r => {r.setMentionable(true);});
                                    await wh.send(textToSend.join(' '));
                                    await message.channel.send(rolesToMention.map(m => m.toString()).join('\n')).then(ping => ping.delete());
                                    await rolesToMention.map(r => {r.setMentionable(false);})
                                    await wh.delete();
                                });
                            }
                        }
                    });
                });
            }
        }
    }
});

client.login(config.token);