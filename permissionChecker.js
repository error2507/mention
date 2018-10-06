var missingPerms = [];
module.exports.run = async guild => {
    function check(guild) {
        if (!guild.me.hasPermission('MANAGE_ROLES')) {
            missingPerms.push('Manage roles');
        }
        if (!guild.me.hasPermission('MANAGE_WEBHOOKS')) {
            missingPerms.push('Manage webhooks');
        }
        if (!guild.me.hasPermission('MANAGE_MESSAGES')) {
            missingPerms.push('Manage messages');
        }
    }
    await check(guild);
    return missingPerms
}