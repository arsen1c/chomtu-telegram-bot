import { translate } from "@vitalets/google-translate-api"

export default {
    name: 'translate',
    description: 'Translation from one language to another. Flags are optional, default language of translation is english.',
    usage: '-hi -en नमस्ते OR /translate नमस्ते',
    args: true,
    argumentType: 'valid input',
    chatAction: 'typing',
    async execute(ctx, query) {
        const [sourceLang, toLang = "en"] = String(query.join(" ")).match(/[-][a-zA-Z]+/g) || []
        const queryParam = query.filter(q => !q.startsWith("-")).join(" ")

        try {
            const options = {
                ...(sourceLang && { from: sourceLang.replace("-", "") }),
                to: toLang ? toLang.replace("-", "") : "en"
            }

            const { text } = await translate(queryParam, options)
            await ctx.replyWithMarkdown(`Query ${sourceLang && `(${sourceLang})`}: ${queryParam}\n\nTranslation (${toLang}): ${text}`);
        } catch (e) {
            if (e.name === "TooManyRequestsError") {
                return await ctx.reply("Too many requests. Please try again later.")
            }
            await ctx.reply(e.message);
        }
    },
};