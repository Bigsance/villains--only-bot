const commands = {
  "!help": "Welcome to VILLAINS ONLY BOT 😈",
  "!rules": "1. Respect members.\n2. No spam.\n3. No insults.",
  "!owner": "The boss Big Sance 👑"
};

function handleCommand(message) {
  return commands[message] || "Unknown command. Type !help";
}

console.log(handleCommand("!help"));
console.log(handleCommand("!rules"));
console.log(handleCommand("!owner"));
cat > index.js <<'EOF'
const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', () => {
    console.log('Scan the QR code to connect WhatsApp.');
});

client.on('ready', () => {
    console.log('VILLAINS ONLY BOT is online! 😈');
});

client.on('message', async (message) => {
    if (message.body === '!help') {
        await message.reply(
            '😈 VILLAINS ONLY BOT\n\n' +
            '!help - Show commands\n' +
            '!rules - Show group rules'
        );
    }

    if (message.body === '!rules') {
        await message.reply(
            '📜 GROUP RULES\n' +
            '1. Respect members.\n' +
            '2. No spam.\n' +
            '3. No insults.'
        );
    }
});

client.on('group_join', async (notification) => {
    try {
        await notification.reply(
            '😈 Welcome to the group! Respect everybody and enjoy your stay.'
        );
    } catch (error) {
        console.log('Welcome message failed:', error.message);
    }
});

client.initialize();
EOF
