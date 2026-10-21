const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: process.env.CHROME_BIN || '/usr/bin/chromium',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    }
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

function isAdmin(chat, senderId) {
    const participant = chat.participants.find(
        p => p.id._serialized === senderId
    );

    return Boolean(
        participant &&
        (participant.isAdmin || participant.isSuperAdmin)
    );
}

// QR LOGIN
client.on('qr', qr => {
    console.log('Scan this QR code with WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// BOT ONLINE
client.on('ready', () => {
    console.log('😈 VILLAINS ONLY BOT IS ONLINE!');
});

client.on('auth_failure', message => {
    console.error('WhatsApp authentication failed:', message);
});

client.on('disconnected', reason => {
    console.log('Bot disconnected:', reason);
});

// GROUP COMMANDS
client.on('message', async message => {
    try {
        const chat = await message.getChat();

        if (!chat.isGroup) return;

        const groupId = chat.id._serialized;
        const config = getSettings(groupId);
        const senderId = message.author;

        if (!senderId) return;

        const admin = isAdmin(chat, senderId);
        const body = message.body.trim();
        const lower = body.toLowerCase();

        // ADMIN SETTINGS
        if (
            lower.startsWith('!antilink ') ||
            lower.startsWith('!warnings ')
        ) {
            if (!admin) {
                return message.reply(
                    '⛔ Only group admins can change settings.'
                );
            }

            const [feature, value] = lower.split(/\s+/);

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
                    `⚠️ Warnings are now ${value.toUpperCase()}.`
                );
            }
        }

        // ANTI-LINK
        const hasLink =
            /(https?:\/\/|www\.|chat\.whatsapp\.com\/)/i.test(body);

        if (config.antilink && hasLink && !admin) {
            try {
                await message.delete(true);
            } catch (error) {
                console.log('Could not delete link:', error.message);
            }

            if (!config.warnings) return;

            const key = `${groupId}:${senderId}`;
            warnings[key] = (warnings[key] || 0) + 1;

            const count = warnings[key];

            if (count >= 3) {
                const botId = client.info?.wid?._serialized;

                const botParticipant = chat.participants.find(
                    p => p.id._serialized === botId
                );

                if (
                    botParticipant &&
                    (botParticipant.isAdmin ||
                     botParticipant.isSuperAdmin)
                ) {
                    await chat.removeParticipants([senderId]);
                    delete warnings[key];

                    return chat.sendMessage(
                        '🚫 A member was removed after 3 link warnings.'
                    );
                }

                return chat.sendMessage(
                    `⚠️ @${senderId.split('@')[0]} has reached 3 warnings. ` +
                    'The bot needs admin permission to remove members.',
                    { mentions: [senderId] }
                );
            }

            return chat.sendMessage(
                `⚠️ @${senderId.split('@')[0]}, link deleted! Warning ${count}/3.`,
                { mentions: [senderId] }
            );
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
                '📜 VILLAINS ONLY RULES\n\n' +
                '1. Respect every member.\n' +
                '2. No spamming.\n' +
                '3. No unwanted links.\n' +
                '4. No bullying or harassment.\n' +
                '5. Follow the group admins.'
            );
        }

        // TAG ALL — ADMIN ONLY
        if (lower === '!tagall') {
            if (!admin) {
                return message.reply(
                    '⛔ Only group admins can use !tagall.'
                );
            }

            const botId = client.info?.wid?._serialized;

            const participants = chat.participants.filter(
                p => p.id._serialized !== botId
            );

            if (participants.length === 0) {
                return message.reply('No members to mention.');
            }

            const mentions = participants.map(
                p => p.id._serialized
            );

            const names = mentions.map(
                id => `@${id.split('@')[0]}`
            );

            return chat.sendMessage(
                `📢 VILLAINS ONLY — ATTENTION!\n\n${names.join(' ')}`,
                { mentions }
            );
        }

        // KICK — ADMIN ONLY
        if (lower.startsWith('!kick')) {
            if (!admin) {
                return message.reply(
                    '⛔ Only group admins can use !kick.'
                );
            }

            const targets = message.mentionedIds || [];

            if (targets.length === 0) {
                return message.reply(
                    'Mention the member you want to remove.'
                );
            }

            const botId = client.info?.wid?._serialized;

            const botParticipant = chat.participants.find(
                p => p.id._serialized === botId
            );

            if (
                !botParticipant ||
                !(botParticipant.isAdmin ||
                  botParticipant.isSuperAdmin)
            ) {
                return message.reply(
                    '⚠️ Make the bot a group admin first.'
                );
            }

            await chat.removeParticipants(targets);

            return chat.sendMessage(
                '🚫 Admin moderation action completed.'
            );
        }

    } catch (error) {
        console.error('Command error:', error.message);
    }
});

// WELCOME NEW MEMBERS
client.on('group_join', async notification => {
    try {
        const chat = await notification.getChat();

        await chat.sendMessage(
            '😈 Welcome to VILLAINS ONLY!\n\n' +
            '📜 Type !rules to read our group rules.\n' +
            '🤝 Respect members and enjoy your stay!'
        );
    } catch (error) {
        console.error('Welcome message error:', error.message);
    }
});

// START BOT
client.initialize();
