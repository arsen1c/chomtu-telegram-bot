import axios from 'axios';
import { fetchHTML, iterateHTML } from '../helpers';

const lyreka = async (songName) => {
  const baseURL = `https://www.lyreka.com/song/${songName.join('-')}-lyrics`;

  const html = fetchHTML(baseURL);

  return html
    .then((result) => {
      // Get Song name
      const song = result('section.lyrics-container > h2 > q').text();

      // Get Artist Name
      const artist = iterateHTML(
        result,
        'div.col-8 > h1 > b > a.artist-name'
      ).join(', ');

      // Get the Lyrics Div.
      const lyrics = result('div.lyrics').text().trim();
      // Grab the cover pic of that song.
      const coverURL = result('img.img-track-cover').attr('src');
      return {
        success: true,
        song,
        artist,
        lyrics,
        cover: coverURL,
        url: baseURL,
      };
    })
    .catch((err) => {
      console.log(err.message);
      return {
        status: 'fail',
        message: '🥴 Song not found',
      };
    });
};

/**
  Following step is harmful, check more here: https://stackoverflow.com/questions/20082893/unable-to-verify-leaf-signature/20100521#20100521
*/
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

// [+] From Gaana.com [+]
const getSuggestions = async (lyrics) => {
  const URL =  `https://gsearch-prod-cloud.gaana.com/gaanasearch-api/mobilesuggest/autosuggest-lite-vltr-ro?geoLocation=IN&query=${lyrics}&content_filter=2&include=allItems&isRegSrch=0&webVersion=mix&rType=web&usrLang=Hindi,English,Punjabi`
  let suggestions = `Didn't find the song, but I have some suggestions for ya.\nType: /gaana (song_suggestion)\n\n`;

  try {
    const {data} = await axios.get(URL);

    // console.log(JSON.stringify(data, null, 2))
    data.gr[0].gd.forEach(song => {
      suggestions += `<b>${song.ti} (${song.sti})</b>\n/gaana ${song.seo.split("-").join(" ")}\n\n`
    })
    
    return suggestions

  } catch (error) {
    console.log(error);
    return `Error: ${error.message}`
  }
}

const gaana = async (song) => {
  const URL = `https://gaana.com/lyrics/`
  const data = fetchHTML(URL + "" + song.join("-"))

  return data.then(async(html) => {
    let body = ``;
    let lyrics = html(".lyr_data > ._inner > p").text();
    let album = html("p.al_name > a").text();
    let year = html("p.al_name").text().match(/[0-9]+/g);
    let artists = html("ul.singers").text();

    body += `<b>Album:</b> ${album} - ${year}\n<b>Artist[s]</b>: ${artists}\n\n<b>Lyrics:</b>\n\n${lyrics}`
    return { markdown: body }
  }).catch (async (error) => {
      return {markdown: await getSuggestions(song.join("%20"))}
  })
};

export default {
  lyreka,
  gaana,
};
