import { fetchHTML, iterateLINKS, iterateHTML, iterateLINKSAndText, iterateHTMLText } from '../helpers/index';

const flags = new Map([['none', 0], ['audio', 100], ['video', 200], ['app', 300], ['game', 400], ['nsfw', 500]]);

export const escapeSymbols = (str) => {
    return str.replace(/_/gi, '\_')
        .replace(/\*/gi, '\\*')
        .replace(/\[/gi, '\\[')
        .replace(/\]/gi, '\\]')
        .replace(/\(/gi, '\\(')
        .replace(/\)/gi, '\\)')
        .replace(/\~/gi, '\\~')
        .replace(/\`/gi, '\\`')
        .replace(/\>/gi, '\\>')
        .replace(/\#/gi, '\\#')
        .replace(/\+/gi, '\\+')
        .replace(/\-/gi, '\\-')
        .replace(/\=/gi, '\\=')
        .replace(/\|/gi, '\\|')
        .replace(/\{/gi, '\\{')
        .replace(/\}/gi, '\\}')
        .replace(/\./gi, '\\.')
        .replace(/\!/gi, '\\!')
}

const queryTorrent = async (query, page = 1, flag) => {
    const baseURL = `https://thepiratebay10.org/search/${encodeURI(query.join(" "))}/${page}/99/${flag ? flags.get(flag) : 0}`;
    // console.log("Url:", baseURL);
    const response = fetchHTML(baseURL);

    return response.then(res => {
        const resultType = iterateHTMLText(res, "table#searchResult > tbody > tr > td.vertTh", "/");

        if (!resultType.length) throw new Error("No result found!");

        const titleAndLink = iterateLINKSAndText(res, "table#searchResult > tbody > tr > td > div.detName > a.detLink");
        const magnetLink = iterateLINKS(res, "table#searchResult > tbody > tr > td > a[title='Download this torrent using magnet']", "href");
        const seedersLeechers = iterateHTML(res, "table#searchResult > tbody > tr > td[align='right']");
        const actualSeedersAndLeechers = [];

        /* Algorithm to group seeders and leechers from "seedersLeechers" array */
        let j = 0;
        let k = 1;
        for (let i = 0; i < seedersLeechers.length / 2; i++) {
            actualSeedersAndLeechers[i] = [seedersLeechers[j], seedersLeechers[k]];
            j += 2;
            k += 2;
        }

        /* Print the result array */
        let finalResult = resultType.map((item, i) => {
            const obj = {};
            obj.type = item;
            obj.title = titleAndLink[i][0];
            obj.link = titleAndLink[i][1];
            obj.magnetLink = magnetLink[i];
            obj['seeders/leechers'] = actualSeedersAndLeechers[i];

            return obj;
        })


        let markdown = "☠️ <b>Pirate Bay Results</b>\n\n";

        finalResult.forEach((item, i) => {
            markdown += `${i + 1}. <a href="${item.link}">${item.title}</a>\n<b>(${item.type})</b> \n<b>[SE: ${item['seeders/leechers'][0]} / LE: ${item['seeders/leechers'][1]}]</b>\n\n`
        })

        return { markdown, finalResult }

    }).catch(error => {
        if (error.message === "400: Bad Request: message text is empty") {
            return "No result found!";
        }
        throw new Error(error);
    })
}

export {
    queryTorrent
}