class PermissionChecker {

    /**
     * Checks permissions for an guild
     * 
     * @param {Guild} guild 
     */

    static check(guild) {
        return guild.me.permissions.missing(["MANAGE_ROLES", "MANAGE_WEBHOOKS", "MANAGE_MESSAGES"]);
    };
};

module.exports = PermissionChecker;