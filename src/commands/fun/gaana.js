import getLyrics from '../../services/getLyrics';

module.exports = {
  name: 'gaana',
  description: 'Search for lyrics on Gaana.com',
  args: true,
  argumentType: 'song name',
  usage: '<song-name>',
  chatAction: 'typing',
  async execute(ctx, songName) {
    const lyrics = await getLyrics.gaana(songName);
    // ctx.reply(lyrics.markdown);
    await ctx.telegram.sendMessage(ctx.chat.id, lyrics.markdown, {
      parse_mode: 'HTML',
    });
  },
};
