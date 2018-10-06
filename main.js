// Modules
const permissionChecker = require('./permissionChecker')

// Constants
const Discord = require('discord.js');
const fs      = require('fs');
const client = new Discord.Client();
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const roles  = JSON.parse(fs.readFileSync('roles.json', 'utf8'));

// Cooldowns
var cooldowns = {};

client.on('ready', function() {
    console.log(`${client.user.username}#${client.user.discriminator} is ready. ${roles.list.length} roles loaded.`);
})

client.on('message', async msg => {
    if (msg.channel.type == 'text') {
        var rolesToMention = [];
        for(i = 0; i < roles.list.length; i++) {
            if (!(msg.webhookID)) {
                if (!(msg.author.bot)) {
                    if (msg.content.toUpperCase().includes('@' + msg.guild.roles.get(roles.list[i].id).name.toUpperCase())) {
                        var mentionRole = msg.guild.roles.get(roles.list[i].id)
                        if (!(cooldowns[msg.author.id]) || !(cooldowns[msg.author.id].includes(mentionRole.id))) {
                            missingPerms = await permissionChecker.run(msg.guild)
                            if (missingPerms.length == 0) {
                                rolesToMention.push(mentionRole);
                            } else {
                                msg.channel.send('I need following permissions in order to work:\n' + missingPerms.join('\n'));
                            }
                        }
                    }
                }
            }
        }
        if (rolesToMention.length != 0) {
            msg.channel.send(`Do you really want to mention following roles?\n${rolesToMention.map(r => '**' + r.name + '**').join('\n')}`).then(async askMsg => {
                await askMsg.react('✅');
                await askMsg.react('❌');
                const filter = (reaction, user) => (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === msg.author.id
                askMsg.awaitReactions(filter, { time: 10000, max: 1}).then(async collected => {
                    askMsg.delete();
                    if (collected.size == 1) {
                        if (collected.first().emoji == '✅') {
                            msg.delete();
                            var text = msg.content.toUpperCase().split(' ');
                            var textToSend = msg.content.split(' ');
                            for(r = 0; r < rolesToMention.length; r++) {
                                if (msg.content.toUpperCase().includes(rolesToMention[r].name.toUpperCase())) {
                                    for(w = 0; w < text.length; w++) {
                                        if (text[w].startsWith('@')) {
                                            var withoutAt = await text[w].substr(1, text[w].length)
                                            if (withoutAt.toUpperCase() == rolesToMention[r].name.toUpperCase()) {
                                                textToSend[w] = rolesToMention[r].toString();
                                                //Adding Cooldown
                                                for(i = 0; i < roles.list.length; i++) {
                                                    if (roles.list[i].id == rolesToMention[r].id) {
                                                        if (cooldowns[msg.author.id]) {
                                                            await cooldowns[msg.author.id].push(rolesToMention[r].id);
                                                            var idToRemoveIndex = await cooldowns[msg.author.id].length - 1;
                                                            setTimeout(function() {
                                                                cooldowns[msg.author.id].splice(idToRemoveIndex, 1);
                                                            }, roles.list[i].cooldown * 1000);
                                                        } else {
                                                            function cooldownArrayCreate() {
                                                                cooldowns[msg.author.id] = [rolesToMention[r].id];
                                                            }
                                                            await cooldownArrayCreate();
                                                            var idToRemoveIndex = await cooldowns[msg.author.id].length - 1;
                                                            setTimeout(function() {
                                                                cooldowns[msg.author.id].splice(idToRemoveIndex, 1);
                                                            }, roles.list[i].cooldown * 1000)
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            msg.channel.createWebhook(msg.member.displayName, msg.author.displayAvatarURL).then(async wh => {
                                await rolesToMention.map(r => {r.setMentionable(true);});
                                await wh.send(textToSend.join(' '));
                                await msg.channel.send(rolesToMention.map(m => m.toString()).join('\n')).then(ping => ping.delete());
                                await rolesToMention.map(r => {r.setMentionable(false);})
                                await wh.delete();
                            });
                        }
                    }
                });
            });
        }
    }
});

client.login(config.token);