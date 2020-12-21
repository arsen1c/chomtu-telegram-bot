const axios = require("axios");

// Make request
const searchWord = (word) => {
    dict_link = `https://od-api.oxforddictionaries.com/api/v2/entries/en-us/${word}`;

    return axios
        .get(dict_link, {
            headers: {
                app_id: process.env.OXFORD_APP_ID,
                app_key: process.env.OXFORD_APP_KEY,
            },
        })
        .then((response) => {
            return {
                status: "success",
                definition: response.data.results[0].lexicalEntries[0].entries[0].senses[0].definitions[0],
                shortDefinitions: response.data.results[0].lexicalEntries[0].entries[0].senses[0].shortDefinitions[0],
            };
        })
        .catch((err) => {
            return { status: "fail", err: err };
        });
};

const whatIs = async (word) => {
    const result = await searchWord(word);

    if (result.status !== "success") {
        return { markdown: "no word found" };
    }
    return {
       markdown: `*Definition*:\t ${result.definition}\n\n*Short-Definition*:\t ${result.shortDefinitions}`
    };
};

module.exports = whatIs;
