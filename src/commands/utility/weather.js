import { fetchHTML, iterateHTML, getCityCords } from '../../helpers/index.js';

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
    const { cords: cityCords, placeName } = await getCityCords(cityName);
    const baseURL = `https://weather.com/en-IN/weather/today/${cityCords}?&temp=c`;

    const scrapeData = fetchHTML(baseURL);

    return scrapeData
      .then((result) => {
        /* City name */
        const city = placeName

        if (!city) throw new Error("City not found");

        /* Weather background image */
        const bgImage = result(".CurrentConditions--CurrentConditions--4Lqax > section").attr("style").match(/\(([^)]+)\)/)[1];

        /* Temperature */
        const temp = result('span[data-testid=TemperatureValue]')
          .text()
          .split('°')[0];

        /* Air Quality */
        const aqi = result('text[data-testid="DonutChartValue"]').text();
        const aqiRemark = result('span[data-testid="AirQualityCategory"]').text();
        const aqiDescription = result('p[data-testid="AirQualitySeverity"]').text();

        /* Current Weather */
        const currentWeather = result(
          'div[data-testid="wxPhrase"]'
        ).text();

        /* Exapected temperature */
        const expectedTemperature = result(
          '.CurrentConditions--tempHiLoValue--Og9IG'
        ).text();

        /* Last updated */
        const lastUpdated = result('.CurrentConditions--timestamp--LqnOd')
          .text()
          .split('As of')
          .join('');
        const hour = Number(lastUpdated.match(/[0-9]+/g)[0]);

        // Insight Data
        const insight_heading = result(
          '.InsightNotification--headline--xQ4GM'
        ).text();
        const insight_desc = result('.InsightNotification--text--wOZxZ').text();

        // Other details labels
        const detailsLabels = iterateHTML(
          result,
          'div[data-testid="WeatherDetailsLabel"]'
        );

        // Other details values
        const detailsValues = iterateHTML(
          result,
          'div[data-testid="wxData"]'
        );

        // Combine detailsLabels and detailsValues to form an object
        const details = Object.assign(
          ...detailsLabels.map((key, i) => ({
            [key]: detailsValues[i],
          }))
        );

        /* Todays Forecast */
        const foreCastTime = ['Morning', 'Afternoon', 'Evening', 'Overnight'];

        // forecast temperatures for Morning, Afternoon, Evening and Overnight
        const forecastTemperature = iterateHTML(
          result,
          'div[data-testid="SegmentHighTemp"] > span[data-testid="TemperatureValue"]'
        ).splice(0, 4);

        // forecast rain for Morning, Afternoon, Evening and Overnight
        const forecastRain = iterateHTML(
          result,
          'div[data-testid="SegmentPrecipPercentage"] > span'
        ).splice(0, 4);

        // create a forecast object that will have forecast temp and forecast rain associated with time of the day.
        const foreCast = Object.assign(
          ...foreCastTime.map((key, i) => ({
            [foreCastTime[i]]: `${forecastTemperature[i]} (☔️ ${forecastRain[i].match(
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
            `<b>Air Quality:</b> ${aqi} (${aqiRemark})\n` +
            `${aqiDescription && `<b><em>(${aqiDescription})</em></b>\n\n`}` +
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
          message: "City not found",
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

export default {
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
