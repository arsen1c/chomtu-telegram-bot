import getLyrics from '../../services/getLyrics';

module.exports = {
  name: 'lyrics',
  description: 'Get lyrics of songs [English]',
  args: true,
  usage: '<song-name>',
  chatAction: 'typing',
  async execute(ctx, songName) {
    const resultObj = await getLyrics.lyreka(songName);

    if (resultObj.success) {
      const lyricsResponse = `*🎶 Song Name:* ${resultObj.song}\n` +
                              `*Artist[s]:* ${resultObj.artist}\n\n` +
                              `*Lyrics*:\n${resultObj.lyrics}\n` +
                              `[Cover](${resultObj.cover})`;

      const lyricsTooLongResp = `*🎶 Song Name:* ${resultObj.song}\n` +
                                `*Artist[s]:* ${resultObj.artist}\n\n` +
                                `😳 Song is too long, read the lyrics [here](${resultObj.url})\n`
      try {
        await ctx.telegram.sendMessage(ctx.chat.id, lyricsResponse, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: 'Read on Lyreka', url: resultObj.url },
                ...(resultObj.ytLink && [{ text: 'Listen on YouTube', url: resultObj.ytLink }])
              ]
            ],
          },
        })
      } catch {
        await ctx.telegram.sendMessage(ctx.chat.id, lyricsTooLongResp, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: 'Read on Lyreka', url: resultObj.url },
                ...(resultObj.ytLink && [{ text: 'Listen on YouTube', url: resultObj.ytLink }])
              ]
            ],
          },
        })
      }
    } else {
      return ctx.replyWithMarkdown(`${resultObj.message}`);
    }
  },
};
