import covidService from '../../services/covidService.js';

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export default {
  name: 'covid',
  description: 'Get covid data of a specific country',
  usage: '<country-name>',
  args: true,
  argumentType: 'a country name',
  chatAction: 'typing',
  async execute(ctx, country) {
    const result = await covidService.covid(country.join('-'));
    if (result.status === 'fail') {
      ctx.replyWithMarkdown(result.markdown);
    } else {
      await ctx.telegram.sendMessage(ctx.chat.id, result.markdown, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: 'More on Worldometers', url: result.url }]],
        },
      });
    }
  },
};
