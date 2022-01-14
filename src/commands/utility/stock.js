import axios from 'axios';
import { iterateHTML, fetchHTML } from '../../helpers';

module.exports = {
  name: 'stock',
  description: 'Get data about a specific stock(India Only)',
  usage: '<stock-name>',
  args: true,
  chatAction: 'typing',
  async execute(ctx, stock) {
    try {
      const baseURL = `https://www.screener.in/company/${stock.join("")}/`;

      const response = fetchHTML(baseURL);

      response.then(async(html) => {
        let stock = html("h1").text();
        let propertyName = iterateHTML(html, "li > span.name");
        let propertyValue = iterateHTML(html , "li > span > span.number");
        let pros = iterateHTML(html , ".pros > ul > li");
        let cons = iterateHTML(html , ".cons > ul > li");
        const keyPoints = iterateHTML(html, ".sub.commentary > p");
        const about = html(".sub.about > p").text();

        const details = Object.assign(...propertyName.map((key, i) => {
          if (i == 2) return {[key.trim()]: `${propertyValue[i]} / ${propertyValue[i+1]}`}
          return {[key.trim()]: propertyValue[i > 2 ? i+1 : i]}
        }));

        let prosData = "";
        let consData = "";
        let keypointsData = "\n";

        pros.forEach(e => prosData += `\n\t\t- ${e.trim()}`);
        cons.forEach(e => consData += `\n\t\t- ${e.trim()}`);
        keyPoints.forEach((e, i) => keypointsData += `${e.trim()}\n\n`);


        let markdown = `\n`+
          `📊 ${stock}\n\n` +
          `<b>Market Cap:</b> ₹ ${details["Market Cap"]} Cr\n` +
          `<b>Current Price:</b> ₹ ${details["Current Price"]}\n` +
          `<b>High / Low:</b> ₹ ${details["High / Low"]}\n` +
          `<b>Stock P/E:</b> ${details["Stock P/E"]}\n` +
          `<b>Book Value:</b> ₹ ${details["Book Value"]}\n` +
          `<b>Dividend Yield:</b> ${details["Dividend Yield"]} %\n` +
          `<b>ROCE:</b> ${details["ROCE"]} %\n` +
          `<b>ROE:</b> ${details["ROE"]} %\n` +
          `<b>Face Value:</b> ₹ ${details["Face Value"]}\n\n` +
          (keyPoints.length && `📝 <b>Key Points:</b>${keypointsData}\n\n`) + 
          `✅ <b>Pros:</b>${prosData}\n\n` +
          `🚫 <b>Cons:</b>${consData}\n\n` + 
          `📖 <b>About\n</b>${about.trim()}`;

          await ctx.telegram.sendMessage(ctx.chat.id, markdown, {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[{ text: "More on Screener.in", url: baseURL }]]
            }
          });

      }).catch(e => {
        const url = `https://www.screener.in/api/company/search/?q=${stock.join("+")}&v=2`;
        let suggestions = "*Suggestions*\n\n";
        
        const data = axios.get(url);
        data.then(res => {
          let list = [...res.data];
          list.forEach(company => {
            // Match Allcaps words or text&text form
            suggestions += String(`*${company.url.match(/[A-Z].+[A-Z]|[A-Z]+/g)[0]}* - ${company.name}\n\n`);
          });

          !list.length ? ctx.reply("Stock not found") : ctx.replyWithMarkdown(suggestions);
        })
          .catch(e => {
            // ctx.reply(e.message);
            ctx.reply("Stock not found");
          })
               
      });
    } catch (e) {
      // console.log(e);
      ctx.reply(e.message);
    }
  },
};
