import express from 'express';
import { BRAD_API, BOT_API } from './src/config/index.js';
import { Telegraf } from 'telegraf';
import fs from "node:fs"

const BOT_TOKEN = process.env.NODE_ENV === 'production' ? BOT_API : BRAD_API;
const bot = new Telegraf(BOT_TOKEN);
const app = express();

console.log({ BOT_TOKEN })
// Grab all command folder in ./commands
const commandFolders = fs.readdirSync('./src/commands');
console.log({ commandFolders })
const collection = new Map();

async function seedCommands() {
  // Get all the commands and put them in collection map
  for (const folder of commandFolders) {
    // Get files from each command folder
    const commandFiles = fs
      .readdirSync(`./src/commands/${folder}`)
      .filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
      const { default: command } = await import(`./src/commands/${folder}/${file}`);
      collection.set(command.name, command);
    }
  }
}

seedCommands()


bot.on('message', (ctx) => {
  if (!ctx.message.text || !ctx.message.text.startsWith('/')) return;

  // grab the command name
  const commandName = ctx.message.text.match(/\/[a-zA-Z]+/)[0].toLowerCase().substr(1);

  // look for the command name in the collection map
  if (!collection.has(commandName)) return;

  // get the arguments passed 
  let [_, ...args] = ctx.message.text.split(' ');
  // grab the command object
  const command = collection.get(commandName);

  if (!command) return;

  if (command.args && !args.length) {
    let reply = `*Please provide ${command.argumentType || "a query"}.*\n\n*Usage*: /${command.name} _${command.usage}_\n*Description*: ${command.description}`;
    return ctx.replyWithMarkdown(reply, { reply_to_message_id: ctx.message.message_id });
  }

  try {
    // Set chat action to 'typing' or 'sending a file'
    ctx.telegram.sendChatAction(ctx.chat.id, command.chatAction);
    if (command.name === 'help')
      return command.execute(ctx, (args = args), collection);
    command.execute(ctx, (args = args));
  } catch (err) {
    console.log(err);
    ctx.reply(
      `Uhg, I ran into some errors, but don't worry it should be fixed soon`
    );
  }
});

app.get('/', (_req, res) => res.send('bot online'));

// Function to start the bot
function startBot() {
  console.log('Bot is running...');
  bot.launch();
}

app.listen(process.env.PORT || 3000, startBot());