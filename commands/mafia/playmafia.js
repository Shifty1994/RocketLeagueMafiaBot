module.exports = {
  name: "playmafia",
  category: "mafia",
  permissions: [],
  devOnly: false,
  run: async ({ client, message, args }) => {
    const voiceChannelId = message.member.voice.channelId;

    if (voiceChannelId) {
      const membersInVoiceArray =
        message.guild.channels.cache.get(voiceChannelId).members;

      randomUserId = membersInVoiceArray.random().user.id;

      const user = await client.users
        .fetch(randomUserId.toString())
        .catch(() => null);

      if (!user) return message.channel.send("User not found:(");

      await user
        .send(
          "You are mafia, Try to loose the game but dont let others figure it out"
        )
        .catch(() => {
          message.channel.send(
            "User has DMs closed or has no mutual servers with the bot:("
          );
        });

      //const channel = message.guild.channels.get("879040018402914384"); //replace voiceChannelId with your voice Channel ID

      //let toCheck = channel.members;

      //message.reply("a random person: " + toCheck.random());
    }
  },
};
