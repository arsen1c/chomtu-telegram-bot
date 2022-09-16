import { iterateLINKS, fetchDDGHTML } from '../../helpers';
import axios from 'axios';
import userAgents from '../../helpers/user-agents.json';

const randomNumber = (max) => Math.floor(Math.random() * max);

module.exports = {
  name: 'get',
  description: 'Search for images across the web',
  args: true,
  chatAction: 'upload_photo',
  usage: '<query>',
  async execute(ctx, query) {
    console.log('Query:', query);
    try {
      const response = await fetchDDGHTML(query.join('+'));
      const regex = /vqd=([\d-]+)\&/g;
      const vdqToken = response.match(regex)[0];
      // p=-1 to turn off safe search
      const baseUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${query.join(
        '+'
      )}&${vdqToken}f=,,,,,&p=1&p=-1`;
      const currUserAgent = userAgents[randomNumber(userAgents.length)];

      const config = {
        method: 'get',
        url: baseUrl,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'Cache-Control': 'no-cache',
          Referer: 'https://duckduckgo.com/',
          'User-Agent': currUserAgent,
        },
      };

      const {
        data: { results: images },
      } = await axios(config);

      if (images.length > 0) {
        const imageObj = images[randomNumber(images.length)];
        return ctx.telegram.sendPhoto(ctx.chat.id, imageObj.image, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[{ text: 'Image Link', url: imageObj.image }]],
          },
        });
      }
      return ctx.reply('Nothing found 🤨');
    } catch (error) {
      ctx.reply(error.message);
    }
  },
};
