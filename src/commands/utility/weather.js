import { fetchHTML, iterateHTML, getCityCords } from '../../helpers';

const getCurrentWeatherEmoji = (remark) => {
  const options = {
    // ["Day", "Night"]
    'Mostly Cloudy': ['⛅️', '☁️'],
    'Partly Cloudy': ['⛅️', '☁️'],
    Clear: ['☀️', '🌕'],
    Sunny: ['🌞', '🌞'],
    'Mostly Clear': ['🌤', '🌗'],
    Fog: ['🌫️', '🌫'],
    'Showers in the Vicinity': ['☔️', '☔️'],
    'Rain Shower': ['🌦', '☔️'],
    'Light Rain Shower/Wind': ['🌦', '☔️'],
    Smoke: ['💨', '💨'],
    Fair: ['🌤', '🌖'],
    'Heavy Rain/Wind': ['🌧', '🌧'],
    'Heavy Thunderstorm/Wind': ['⛈', '⛈'],
    'Light Rain with Thunder': ['🌧', '🌧'],
    Thunder: ['🌩', '🌩'],
    Rain: ['🌧', '🌧'],
    Drizzle: ['🌧', '🌧'],
    'Rain and Snow': ['❄️', '❄️'],
    Snow: ['❄️', '❄️'],
  };
  if (options[remark]) return options[remark];
  return ['🌥', '🌥'];
};

const getWeather = async (cityName) => {
  try {
    const cityCords = await getCityCords(cityName);
    const baseURL = `https://weather.com/en-IN/weather/today/${cityCords}?&temp=c`;

    const scrapeData = fetchHTML(baseURL);

    return scrapeData
      .then((result) => {
        // Grab city, temp, aqi, weather from them HTML
        const city = result('.CurrentConditions--location--1YWj_').text();

        // Weather background image
        const bgImage = result(".CurrentConditions--CurrentConditions--1XEyg > section").attr("style").match(/\(([^)]+)\)/)[1];

        // Temperature
        const temp = result('span[data-testid=TemperatureValue]')
          .text()
          .split('°')[0];
        // Air Quality
        const aqi = result('text[data-testid="DonutChartValue"]').text();
        const aqiRemark = result('.AirQualityText--severity--1smy9').text();

        // Current Weather
        const currentWeather = result(
          '.CurrentConditions--phraseValue--mZC_p'
        ).text();

        // Exapected temperature
        const expectedTemperature = result(
          '.CurrentConditions--tempHiLoValue--3T1DG'
        ).text();
        let dayNight = expectedTemperature.match(/\d+/g).join('° / ');

        // Last updated
        const lastUpdated = result('.CurrentConditions--timestamp--1ybTk')
          .text()
          .split('As of')
          .join('');
        const hour = Number(lastUpdated.match(/[0-9]+/g)[0]);
        // console.log("hour:", hour < 5 && hour > 19)

        // Insight Data
        const insight_heading = result(
          '.InsightNotification--headline--1hVMc'
        ).text();
        const insight_desc = result('.InsightNotification--text--UxsQt').text();

        // Other details labels
        const detailsLabels = iterateHTML(
          result,
          '.WeatherDetailsListItem--label--2ZacS'
        );

        // Other details values
        const detailsValues = iterateHTML(
          result,
          '.WeatherDetailsListItem--wxData--kK35q'
        );
        // Combine detailsLabels and detailsValues to form an object
        const details = Object.assign(
          ...detailsLabels.map((key, i) => ({
            [key]: detailsValues[i],
          }))
        );
        // console.log("Details: ", details);

        // Todays forecast
        const forecastTime = iterateHTML(
          result,
          '.Column--label--2s30x .Ellipsis--ellipsis--3ADai'
        );
        const forecastTemperature = iterateHTML(
          result,
          ".Column--innerWrapper--3ocxD .Column--temp--1sO_J > span[data-testid='TemperatureValue']"
        );
        const forecastRain = iterateHTML(
          result,
          'span.Column--precip--3JCDO'
        );
        // console.log(forecastRain[1].match(/[0-9]+/))
        const foreCast = Object.assign(
          ...forecastTime.map((key, i) => ({
            [key]: `${forecastTemperature[i]} (☔️ ${forecastRain[i].match(
              /[0-9]+/
            ) || 0}%)`,
          }))
        );

        return {
          success: true,
          url: baseURL,
          markdown:
            `<b>${city}</b>\n\n` +
            `${hour < 5 || hour > 19
              ? getCurrentWeatherEmoji(currentWeather)[1]
              : getCurrentWeatherEmoji(currentWeather)[0]
            } <b>Weather:</b> ${currentWeather}\n` +
            `🌡 <b>Temperature:</b> ${temp}°\n` +
            `🎐 <b>${expectedTemperature}</b>\n\n` +
            // `🎐 <b>Day / Night:</b> ${dayNight}°\n\n` +
            `${insight_heading && `💡 <b>Insight: ${insight_desc}</b>\n\n`}` +
            `🌬 <b>Wind:</b> ${details.Wind.split('Wind Direction').join(
              ' '
            )}\n` +
            `💧 <b>Humidity:</b> ${details.Humidity}\n` +
            `👁 <b>Visibility:</b> ${details.Visibility}\n\n` +
            `<b>UV Index:</b> ${details['UV Index']}\n` +
            `<b>Air Quality:</b> ${aqi} (${aqiRemark})\n\n` +
            `<b>Last Update:</b> ${lastUpdated}\n\n` +
            `📅 <b>Today's Forecast</b>\n\n` +
            `<b>Morning</b>: ${foreCast.Morning}\n` +
            `<b>Afternoon</b>: ${foreCast.Afternoon}\n` +
            `<b>Evening</b>: ${foreCast.Evening}\n` +
            `<b>Overnight</b>: ${foreCast.Overnight}\n\n` +
            `<a href='${bgImage}'>Background</a>\n`
        };
      })
      .catch((err) => {
        console.log(err.message);
        return {
          success: false,
          message: 'City not found',
        };
      });
  } catch (err) {
    console.log(err.message);
    return {
      success: false,
      message: 'Network error',
    };
  }
};

module.exports = {
  name: 'weather',
  description: 'Check weather of a city',
  args: true,
  argumentType: 'a city name',
  usage: '<city-name>',
  chatAction: 'typing',
  async execute(ctx, cityName) {
    try {
      const result = await getWeather(cityName.join('%20'));
      if (!result.success) {
        return ctx.reply(result.message);
      }

      await ctx.telegram.sendMessage(ctx.chat.id, result.markdown, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: 'Open on weather.com', url: result.url }]],
        },
      });
    } catch (err) {
      console.log(err);
      ctx.reply(err.message);
    }
  },
};
