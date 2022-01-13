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
      const baseURL = `https://www.screener.in/company/${stock.join("")}/consolidated/`;

      const response = fetchHTML(baseURL);

      response.then(async(html) => {
        let stock = html("h1").text();
        let propertyName = iterateHTML(html, "li > span.name");
        let propertyValue = iterateHTML(html , "li > span > span.number");
        let pros = iterateHTML(html , ".pros > ul > li");
        let cons = iterateHTML(html , ".cons > ul > li");
        const about = html(".sub.about > p").text();

        const details = Object.assign(...propertyName.map((key, i) => {
          if (i == 2) return {[key.trim()]: `${propertyValue[i]} / ${propertyValue[i+1]}`}
          return {[key.trim()]: propertyValue[i > 2 ? i+1 : i]}
        }));

        let prosData = "";
        let consData = "";

        pros.forEach(e => prosData += `\n\t\t- ${e.trim()}`);
        cons.forEach(e => consData += `\n\t\t- ${e.trim()}`);


        ctx.replyWithMarkdown(`\n`+
          `📊 *${stock}*\n\n` +
          `*Market Cap:* ₹ ${details["Market Cap"]} Cr\n` +
          `*Current Price:* ₹ ${details["Current Price"]}\n` +
          `*High / Low:* ₹ ${details["High / Low"]}\n` +
          `*Stock P/E:* ${details["Stock P/E"]}\n` +
          `*Book Value:* ₹ ${details["Book Value"]}\n` +
          `*Dividend Yield:* ${details["Dividend Yield"]} %\n` +
          `*ROCE:* ${details["ROCE"]} %\n` +
          `*ROE:* ${details["ROE"]} %\n` +
          `*Face Value:* ₹ ${details["Face Value"]}\n\n` +
          `✅ *Pros:*${prosData}\n\n` +
          `🚫 *Cons:*${consData}\n\n` + 
          `📖 *About*\n${about.trim()}`
        );
      }).catch(e => {
        const url = `https://www.screener.in/api/company/search/?q=${stock.join("+")}&v=2`;
        let suggestions = "*Suggestions*\n\n";
        
        const data = axios.get(url);
        data.then(res => {
          let list = [...res.data];
          list.forEach(company => {
            // Match Allcaps words or text&text form
            console.log(company.url);
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
      console.log(e);
      ctx.reply(e.message);
    }
  },
};
