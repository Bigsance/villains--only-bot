const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth()
});

const settings = {};
const warnings = {};

function getSettings(groupId) {
    if (!settings[groupId]) {
        settings[groupId] = {
            antilink: false,
            warnings: true
        };
    }
    return settings[groupId];
}

client.on('ready', () => {
    console.log('😈 VILLAINS ONLY BOT IS ONLINE!');
});

client.on('message', async (message) => {
    try {
        const chat = await message.getChat();

        if (!chat.isGroup) return;

        const groupId = chat.id._serialized;
        const config = getSettings(groupId);
        const senderId = message.author;

        const participant = chat.participants.find(
            p => p.id._serialized === senderId
        );

        const isAdmin = Boolean(
            participant && (participant.isAdmin || participant.isSuperAdmin)
        );

        const command = message.body.trim();
        const lower = command.toLowerCase();

        // ADMIN-ONLY SETTINGS
        if (
            lower.startsWith('!antilink ') ||
            lower.startsWith('!warnings ')
        ) {
            if (!isAdmin) {
                return message.reply('⛔ Only group admins can change settings.');
            }

            const parts = lower.split(/\s+/);
            const feature = parts[0];
            const value = parts[1];

            if (!['on', 'off'].includes(value)) {
                return message.reply('Use on or off.');
            }

            if (feature === '!antilink') {
                config.antilink = value === 'on';
                return message.reply(
                    `🔗 Anti-link is now ${value.toUpperCase()}.`
                );
            }

            if (feature === '!warnings') {
                config.warnings = value === 'on';
                return message.reply(
                    `⚠️ Warning system is now ${value.toUpperCase()}.`
                );
            }
        }

        // DELETE LINKS AND WARN MEMBERS
        const hasLink = /(https?:\/\/|www\.|chat\.whatsapp\.com\/)/i.test(
            message.body
        );

        if (config.antilink && hasLink && !isAdmin) {
            await message.delete(true);

            if (config.warnings) {
                const key = `${groupId}:${senderId}`;
                warnings[key] = (warnings[key] || 0) + 1;

                const count = warnings[key];

                if (count >= 3) {
                    const bot = await chat.getContact();
                    const botId = client.info.wid._serialized;
                    const botParticipant = chat.participants.find(
                        p => p.id._serialized === botId
                    );

                    if (botParticipant &&
                        (botParticipant.isAdmin || botParticipant.isSuperAdmin)) {
                        await chat.removeParticipants([senderId]);
                        delete warnings[key];

                        return chat.sendMessage(
                            `🚫 Member removed after 3 link warnings.`
                        );
                    }

                    return chat.sendMessage(
                        `⚠️ Member reached 3 warnings, but the bot needs admin permission to remove them.`
                    );
                }

                return chat.sendMessage(
                    `⚠️ @${senderId.split('@')[0]}, link deleted! Warning ${count}/3.`,
                    { mentions: [senderId] }
                );
            }

            return;
        }

        // HELP
        if (lower === '!help') {
            return message.reply(
                '😈 VILLAINS ONLY BOT\n\n' +
                '!help - Show commands\n' +
                '!rules - Group rules\n' +
                '!tagall - Mention group members\n' +
                '!kick @member - Remove a mentioned member\n' +
                '!antilink on/off - Admin setting\n' +
                '!warnings on/off - Admin setting'
            );
        }

        // RULES
        if (lower === '!rules') {
            return message.reply(
                '📜 GROUP RULES\n' +
                '1. Respect members.\n' +
                '2. No spam.\n' +
                '3. No unwanted links.'
            );
        }

        // TAG ALL — ADMIN ONLY
        if (lower === '!tagall') {
            if (!isAdmin) {
                return message.reply('⛔ Only group admins can use !tagall.');
            }

            const contacts = await client.getContacts(
                chat.participants.map(p => p.id._serialized)
            );

            const mentions = contacts.filter(
                c => c.id._serialized !== client.info.wid._serialized
            );

            const text = mentions
                .map(c => `@${c.id.user}`)
                .join(' ');

            return chat.sendMessage(
                `📢 ATTENTION GROUP!\n${text}`,
                { mentions }
            );
        }

        // KICK — ADMIN ONLY, TARGET MUST BE MENTIONED
        if (lower.startsWith('!kick')) {
            if (!isAdmin) {
                return message.reply('⛔ Only group admins can use !kick.');
            }

            const targets = message.mentionedIds || [];

            if (!targets.length) {
                return message.reply('Mention the member you want to remove.');
            }

            const botId = client.info.wid._serialized;
            const botParticipant = chat.participants.find(
                p => p.id._serialized === botId
            );

            if (!botParticipant ||
                !(botParticipant.isAdmin || botParticipant.isSuperAdmin)) {
                return message.reply('⚠️ Make the bot a group admin first.');
            }

            await chat.removeParticipants(targets);
            return chat.sendMessage('🚫 Admin moderation action completed.');
        }

    } catch (error) {
        console.log('Command error:', error.message);
    }
});

client.on('group_join', async (notification) => {
    try {
        await notification.reply(
            '😈 Welcome to the group! Respect everybody and enjoy your stay.'
        );
    } catch (error) {
        console.log('Welcome error:', error.message);
    }
});

client.initialize();
