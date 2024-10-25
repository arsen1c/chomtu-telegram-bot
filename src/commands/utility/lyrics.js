import fetchGeniusLyrics from "../../services/lyrics.js"

export default {
    name: 'lyrics',
    description: 'Get lyrics of a song',
    usage: '<song-name>',
    args: true,
    argumentType: 'a song name',
    chatAction: 'typing',
    async execute(ctx, query) {
        const result = await fetchGeniusLyrics(query);
        const BASE_URL = "https://genius.com/"
        try {
            if (result.status === 'fail') {
                return await ctx.replyWithMarkdown(result.markdown)
            }

            await ctx.replyWithMarkdown(result.data.lyrics);
        } catch (e) {
            // if message length is too long
            if (e.response.error_code === 400) {
                // return a link to the lyrics page
                return await ctx.telegram.sendMessage(ctx.chat.id, "Song is too long\\. Check the link below to read it on genius\\.com", {
                    parse_mode: "MarkdownV2",
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Read the lyrics on Genius.com', url: BASE_URL.concat(query.join("-")) + "-lyrics" }],
                        ],
                    }
                })
            }

            await ctx.reply(e.message)
        }
    },
};
