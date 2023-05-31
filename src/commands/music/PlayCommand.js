const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const { MessageEmbed } = require('discord.js');
const ytdl = require('ytdl-core');
const StreamOptions = { seek: 0, volume: 1 }
const { Intents } = require('discord.js');
const myIntents = new Intents();
myIntents.add(Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES);
const bot = new Discord.Client({ intents: myIntents });
var servers = {};
var playing = false;
var connection;
var player;
var loop;
var current_song;
module.exports = class PlayCommand extends BaseCommand {
  constructor() {
    super('play', 'music', []);
  }

  async run(client, message, args) {
    try {
    switch(message.content.split(" ")[0]) {
      case "!play":
        if(!message.content.split(" ")[1]) {
          message.reply("You need a Link or phrase");
          return;
        }
        var search;
        let voiceChannel = message.member.voice.channel;
        if ( !voiceChannel) {
          message.reply('You must be in a voice channel').then(msg => {
            setTimeout(() => message.delete(), 10000)
          });
          return;
        }
        
        if(!servers[message.guild.id]) {
          servers[message.guild.id] = { queue: []};
        }
        var server = servers[message.guild.id];
        search = message.content.split(" ").join(' ');
        search = search.substr(6, search.length);
        const searhres = require('yt-search');
        try {
          const r = await searhres( search );
          const videos = r.videos.slice( 0, 3 );
          search = videos[0].url
        } catch {
          message.reply("Sorry, Nothing came up");
          break;
        };
        server.queue.push(search);
        message.suppressEmbeds(true);
        const songInfo = await ytdl.getInfo(search);
        if(!playing) {
          playing = true;
          const { joinVoiceChannel} = require('@discordjs/voice');
            connection = joinVoiceChannel({
                    channelId: message.member.voice.channel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator
                })
            this.play(connection, message);

        }
        else {
        const exampleEmbed = new MessageEmbed()
          .setColor('#a31202')
          .setTitle('Adding to Queue')
          .setDescription(songInfo.videoDetails.title);
        message.channel.send({ embeds: [exampleEmbed] });
        }
        break;

        case "!skip":
        if(!servers[message.guild.id]) {
          servers[message.guild.id] = { queue: []};
        }
        var server = servers[message.guild.id];
        if(server.queue[0]) {
          this.play(connection, message)
        }
        else if(loop == true && !(server.queue[1])) {
          loop = false;
          player.stop();
          playing = false;
        }
        else {
          if(player) {
            player.stop();
            playing = false;
          }
        }
        break;
      
      case "!clear":
        var server = servers[message.guild.id];
        while(server.queue[0]) {
          server.queue.shift();
        }
        if(player) {
          player.stop();
          playing = false;
        }
        loop = false;
        break;

        case "!dc":
          var server = servers[message.guild.id];
          while(server.queue[0]) {
            server.queue.shift();
          }
          if(player) {
            player.stop();
            playing = false;
          }
          loop = false;
          connection.destroy();
          break;

        case "!loop":
            if(playing == false) {
            const exampleEmbed = new MessageEmbed()
              .setColor('#a31202')
              .setTitle('There Are No Songs In The Queue')
            message.channel.send({ embeds: [exampleEmbed] });
            }
            else if(loop == true) {
              loop = false;
              const exampleEmbed = new MessageEmbed()
                .setColor('#a31202')
                .setTitle('Queue Is No Longer Looped')
              message.channel.send({ embeds: [exampleEmbed] });
            } 
            else {
              loop = true;
              const exampleEmbed = new MessageEmbed()
                .setColor('#a31202')
                .setTitle('Now Looping Queue')
              message.channel.send({ embeds: [exampleEmbed] });
            }
          break;
          }
        }
        catch(err) {
          var server = servers[message.guild.id];
          while(server.queue[0]) {
            server.queue.shift();
          }
          if(player) {
            player.stop();
            playing = false;
          }
          loop = false;
          connection.destroy();
        }
  }

  async play(connection, message) {
    try {
    const { createAudioResource, createAudioPlayer} = require('@discordjs/voice');
    var server = servers[message.guild.id];
    const songInfo = await ytdl.getInfo(server.queue[0]);
    const song = {
           title: songInfo.videoDetails.title,
           url: songInfo.videoDetails.video_url,
    }
    if(loop == false) {
      const exampleEmbed = new MessageEmbed()
        .setColor('#a31202')
        .setTitle('Now Playing')
        .setDescription(song.title);
      message.channel.send({ embeds: [exampleEmbed] });
    }
   // const stream = ytdl(song.url);
    const resource = createAudioResource(ytdl(server.queue[0], {filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1<<25 }), {inlineVolume:true})
    resource.volume.setVolume(0.5);
    player = createAudioPlayer();
    connection.subscribe(player);
    server.dispatcher = player.play(resource);
    if(!server.queue[0]) {
      player.stop();
      playing = false;
    }
    else {
    current_song = server.queue[0];
    server.queue.shift();
    const { AudioPlayerStatus } = require('@discordjs/voice');
    player.on(AudioPlayerStatus.Idle, () => {
      if(loop == true) {
        server.queue.push(current_song);
      }
      if(server.queue[0]) {
        this.play(connection, message)
      }
      else {
        player.stop();
        playing = false;
      }
    })
    }
  }
  catch(err){
    var server = servers[message.guild.id];
    while(server.queue[0]) {
      server.queue.shift();
    }
    if(player) {
      player.stop();
      playing = false;
    }
    loop = false;
    connection.destroy();
  }
  }
}