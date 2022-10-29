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

      // Youtube video
      const ytVideoId = result('div#youtube-media-container').attr('data-id');
      return {
        success: true,
        song,
        artist,
        lyrics,
        cover: coverURL,
        url: baseURL,
        ytVideo: ytVideoId && `https://youtube.com/watch?v=${ytVideoId}`,
        ytMusic: ytVideoId && `https://music.youtube.com/watch?v=${ytVideoId}`,
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

// [+] From Gaana.com [+]
const getSuggestions = async (lyrics) => {
  const URL = `https://gsearch.gaana.com/gaanasearch-api/mobilesuggest/autosuggest-lite-vltr-ro?geoLocation=IN&query=${lyrics}&content_filter=2&include=allItems&isRegSrch=0&webVersion=mix&rType=web&usrLang=Hindi,English,Punjabi`;
  let suggestions = `Didn't find the song, but I have some suggestions for ya.\nType: /gaana (song_suggestion)\n\n`;

  try {
    const { data } = await axios.get(URL);

    // console.log(JSON.stringify(data, null, 2))
    data.gr[0].gd.forEach((song) => {
      suggestions += `<b>${song.ti} (${song.sti})</b>\n/gaana ${song.seo
        .split('-')
        .join(' ')}\n\n`;
    });

    return suggestions;
  } catch (error) {
    console.log(error);
    return `Error: ${error.message}`;
  }
};

const gaana = async (song) => {
  const URL = `https://gaana.com/song/${song.join('-')}`;
  const data = fetchHTML(URL);

  return data
    .then(async (html) => {
      let body = ``;
      let lyrics = html('section.lyrics > div.data > p').text();
      if (!lyrics) throw new Error("Lyrics not found")
      let album = html('._b > _name > a').text();
      let year = html('._b > _date').text();
      let artists = html('ul.singers').text();

      body += `<b>Album:</b> ${album} - ${year}\n<b>Artist[s]</b>: ${artists}\n\n<b>Lyrics:</b>\n\n${lyrics}`;
      return { markdown: body };
    })
    .catch(async (error) => {
      return { markdown: await getSuggestions(song.join('%20')) };
    });
};

export default {
  lyreka,
  gaana,
};
