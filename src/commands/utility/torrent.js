import { queryTorrent } from '../../services/torrent';
import { escapeSymbols } from '../../services/torrent';

module.exports = {
    name: 'torrent',
    // description: escapeSymbols('Search for torrents. Use -type=<type_name> to search for specific type of content.\n\n'
    //     + 'Available flags:\n- page\n- type'
    //     + 'Available Type:\n- audio\n- video\n- app\n- game\n- nsfw' +
    //     + 'Example: `/torrent nfs most wanted -type=game -page=1`'),
    description: "Search torrent. User -page or -flag for extras.",
    usage: '<query-to-search>',
    args: true,
    argumentType: 'a torrent file to search',
    chatAction: 'typing',
    async execute(ctx, query) {
        try {
            const result = await queryTorrent(query, 1, 'none');
            await ctx.telegram.sendMessage(ctx.chat.id, result.markdown, {
                parse_mode: 'HTML'
            });
            return
        } catch (e) {
            await ctx.replyWithMarkdown(e.message);
        }
    },
};
