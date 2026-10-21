const commands = {
  "!help": "Welcome to VILLAINS ONLY BOT 😈",
  "!rules": "1. Respect members.\n2. No spam.\n3. No insults.",
  "!owner": "The boss na Big Sance 👑"
};

function handleCommand(message) {
  return commands[message] || "Unknown command. Type !help";
}

console.log(handleCommand("!help"));
console.log(handleCommand("!rules"));
console.log(handleCommand("!owner"));
