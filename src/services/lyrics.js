import axios from "axios";
import { fetchHTML } from "../helpers/index.js"

const JOINS = {
    suggestions: "+",
    lyrics: "-"
}

function getSearchableSongName(songPathName) {
    return songPathName.replace("/", "").split("-").join(" ").replace("lyrics", "").trim()
}

async function getSongSuggestions(songTitle) {
    const BASE_URL = `https://genius.com/api/search/multi?q=${songTitle.join(JOINS.suggestions)}`

    return axios.get(BASE_URL)
        .then(({ data }) => {
            // grab the songs suggestions from the hits array
            const responseData = data.response.sections[1].hits
            let markdown = "I couldnt find the song you are looking for\. Please look at the suggestions below\. \nPs: Search using the \'*Search*\' key\n\n*Suggestions*\n\n"

            if (responseData.length > 0) {
                responseData.forEach(({ result }, idx) => {
                    /* 
                                        const songData = {}
                    
                                        songData.artist_names = result.artist_names
                                        songData.path = result.path
                                        songData.release_date_for_display = result.release_date_for_display
                     */
                    markdown += `*${idx + 1}. ${result.full_title}*\n*Artist:* ${result.artist_names}\n*Release:* ${result.release_date_for_display}\n*Search:* \/lyrics ${getSearchableSongName(result.path)}\n\n`
                })
            }

            return markdown
        })
        .catch(error => error)
}

async function fetchGeniusLyrics(songTitle = null) {
    const songLyrics = fetchHTML(`https://genius.com/${songTitle.join(JOINS.lyrics)}-lyrics`)

    return songLyrics.then(res => {
        // song metadata
        const songName = res(".SongHeaderdesktop__HiddenMask-sc-1effuo1-11").text()
        const lyrics = res("html body div#application main.SongPage__Container-sc-19xhmoi-0.buKnHw div.SectionScrollSentinel__Container-eoe1bv-0.icvVds div#annotation-portal-target.SongPage__LyricsWrapper-sc-19xhmoi-4.dwmAUC div#lyrics-root-pin-spacer div#lyrics-root.PageGriddesktop-a6v82w-0.SongPageGriddesktop-sc-1px5b71-0.Lyrics__Root-sc-1ynbvzw-0.iEyyHq div.Lyrics__Container-sc-1ynbvzw-5.Dzxov").html()
        console.log(lyrics.replace(/<br>/g, '\n'));
        return {
            status: "success",
            data: {
                songName,
                lyrics: lyrics.replace(/<br>/g, '\n')
            }
        }
    }).catch(async (err) => {
        // song not found
        if (err.response.status === 404) {
            // fetch suggestions
            const suggestionsMarkdown = await getSongSuggestions(songTitle)

            return {
                status: "fail",
                markdown: suggestionsMarkdown
            }
        }

        return {
            status: "fail",
            message: err.message
        }
    })
}

export default fetchGeniusLyrics