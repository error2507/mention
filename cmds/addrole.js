class addrole {

    /**
     * Checks permissions for an guild
     * 
     * @param {Message} message 
     */

    static async addrole(message) {
        let setupMSG
        await message.channel.send(`What role do you want to add? (You have one minute to answer)`).then(msg => { setupMSG = msg })
        await message.channel.awaitMessages(m => m.author.id == message.author.id, {maxMatches: 1, time: 60000})
            .then(async collected => {
                if (collected.size == 1) {
                    if (message.guild.roles.find(r => r.name == collected.first().content)) {
                        //ADD TO DB and set to unmentionable
                        collected.first().delete();
                        setupMSG.edit('Okay, now send the cooldown in seconds please.');
                    } else {
                        message.channel.send("This role can't be found on this server. Please check spelling and try again.");
                        return;
                    }
                } else {
                    await setupMSG.edit('You answer took to long.');
                    await setupMSG.delete('5000');
                    message.delete();
                }
            })
    };
};

module.exports = addrole;