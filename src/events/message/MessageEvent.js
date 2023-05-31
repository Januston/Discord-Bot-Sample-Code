const BaseEvent = require('../../utils/structures/BaseEvent');

module.exports = class MessageEvent extends BaseEvent {
  constructor() {
    super('message');
  }
  
  async run(client, message) {
    if (message.author.bot) return;
    if (message.content.startsWith(client.prefix)) {
      const [cmdName, ...cmdArgs] = message.content
      .slice(client.prefix.length)
      .trim()
      .split(/\s+/);
      if(message.content.split(" ")[0] == "!play" || message.content.split(" ")[0] == "!skip" || message.content.split(" ")[0] == "!clear" || message.content.split(" ")[0] == "!dc" || message.content.split(" ")[0] == "!loop"){
        const command = client.commands.get("play");
        if (command) {
          command.run(client, message, cmdArgs);
        }
      }
      else {
        const command = client.commands.get(cmdName);
        if (command) {
          command.run(client, message, cmdArgs);
        }
      }
    }
  }
}