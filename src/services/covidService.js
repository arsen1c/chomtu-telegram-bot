import axios from 'axios';
import { fetchHTML, iterateHTML } from '../helpers/index.js';

const capitalizeFirstLetter = (string) =>
  string.charAt(0).toUpperCase() + string.slice(1);

const getCovidData = async (country) => {
  const baseURL = `https://www.worldometers.info/coronavirus/country/${country}`;
  // Call fetchHTML function and get the HTML of the page.
  const data = fetchHTML(baseURL);

  return data
    .then((result) => {
      // Grab the country name from returned HTML
      const countryName = result('.label-counter').text().split('/')[2].trim();
      // Get the FlagURL
      const flagURL = `https://www.worldometers.info${result('div > img').attr(
        'src'
      )}`;

      // Data [Array]: Cases / Deaths / Recovered
      const data = iterateHTML(result, "#maincounter-wrap > .maincounter-number > span");
      const update = result('.news_li').text().split('in')[0].trim();
      const date = result('div.news_date > h4').text();

      // Return the Data in JSON form
      return {
        status: true,
        data: {
          countryName,
          flag: flagURL,
          data,
          update,
          lastUpdated: date,
        },
      };
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.log(err.message);
      return {
        satus: false,
        message: 'Country Not Found!',
      };
    });
};

const covid = async (country) => {
  const result = await getCovidData(country);
  if (result.status) {
    return {
      markdown:
        `🦠 <b>Covid:\t ${result.data.countryName}</b>\n\n` +
        `<b>Total Cases:</b>\t ${result.data.data[0]}\n` +
        `<b>Total Deaths:</b>\t ${result.data.data[1]}\n` +
        `<b>Total Recovered:</b>\t ${result.data.data[2]}\n\n` +
        `<b>Updates:</b>\n${result.data.update}\n\n` +
        `<b>Last updated:</b>\n${result.data.lastUpdated}\n\n` +
        `<a href='${result.data.flag}'>Flag</a>`,
      url: `https://www.worldometers.info/coronavirus/country/${country}`
    };
  }

  return {
    status: "fail",
    markdown: `${result.message}`,
  };
};

// get Data for India
const covidIn = async (query) => {
  const data = axios.get(
    'https://api.covid19india.org/state_district_wise.json'
  );
  const district = capitalizeFirstLetter(query);

  return data
    .then(async (res) => {
      // console.log(res.data['Andaman and Nicobar Islands']);
      // eslint-disable-next-line no-restricted-syntax, no-shadow, no-unused-vars
      for (const [state, data] of Object.entries(res.data)) {
        if (district in data.districtData) {
          // console.log(data.districtData[district]);
          return {
            status: 'success',
            markdown:
              `🦠 Covid: *${district}*` +
              `\n\n*Updates*\nConfirmed: ${data.districtData[district].delta.confirmed}\n` +
              `Deaths: ${data.districtData[district].delta.deceased}\n` +
              `Recovered: ${data.districtData[district].delta.recovered}\n\n` +
              `*Data*\nActive: ${data.districtData[district].active}\n` +
              `Total Cases: ${data.districtData[district].confirmed}\n` +
              `Recovered: ${data.districtData[district].recovered}\n` +
              `Deaths: ${data.districtData[district].deceased}\n`,
          };
        }
        // throw new Error('District not found')
      }
      return { status: 'fail', markdown: 'District not found' };
    })
    .catch((err) => {
      console.log(err);
      return { status: 'fail', markdown: err.message };
    });
};

export default {
  covid,
  covidIn,
};
