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

export default {
  lyreka
};
