const cheerio = require("cheerio");
const requestPromise = require("request-promise");

/**
 * 1. Intial url define
 */
const initialUrl =
    "https://www.otomoto.pl/ciezarowe/uzytkowe/mercedes-benz/od-2014/q-actros?search%5Bfilter_enum_damaged%5D=0&search%5Border%5D=created_at%3Adesc";

// async function getNextPageUrl(initialUrl) {
// }
// const nextPageUrl = getNextPageUrl(initialUrl);

async function scrapeOtomoto() {
    const options = {
        uri: initialUrl,
        transform: (body) => body,
        simple: true,
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
        },
    };

    // Step 1: Fetch the initial page and extract the total ads count
    const initialHtml = await requestPromise(options);

    const $ = cheerio.load(initialHtml);
    console.log($);

    const pageUrls = [];

    $('li[data-testid="pagination-list-item"] a').each((i, el) => {
        const pageUrl = $(el).attr("href");
        pageUrls.push(pageUrl);
    });
    // Add getNextPageUrl function to iterate over pages

    const list = [];
    const listOfProduct = $(".ooa-1e8338r").text();

    const adsCountText = $(".offers-index_total").text();
    // const adsCount = parseInt(adsCountText.match(/\d+/)[0], 10);

    /**
     * Product description
     */
    const article = $(".ooa-1e8338r > main > article");
    const articleDiv = $(".ooa-1e8338r > main > div");

    /**
     *
     * @returns getTotalAdsCount
     */
    async function getTotalAdsCount() {
        const totalAdds = article.length;
        return totalAdds;
    }

    article.each((index, element) => {
        /**
         * Use url and data unique id for addItems functions
         */
        const url = $(element).find(".ooa-1nihvj5 > h2 > a").attr("href");
        const dataId = $(element).attr("data-id");

        const title = $(element).find(".ooa-1nihvj5 > h2 > a").text().trim();
        const dealer = $(element).find(".ooa-1nihvj5 > div > p").text().trim();
        const date = $(element).find(".ooa-0").text().trim();

        const description = [];
        $(element)
            .find(".ooa-1nihvj5 > div > ul > li")
            .each((index, element) => {
                if (!description.includes($(element).text().trim())) {
                    description.push($(element).text().trim());
                }
            });

        const location = $(element)
            .find(".ooa-1nihvj5 > ul > li:first-child > span > span")
            .text()
            .trim();

        const price = $(element).find(".eayvfn610 > span").text().trim();
        const profileImage = $(element)
            .find("div.ooa-1g9tpob img.eayvfn618")
            .attr("src");
        const image = $(element).find("span[data-image]").attr("data-image");

        const data = {
            title,
            dealer,
            description,
            location,
            date,
            price,
            profileImage,
            image,
        };
    });
}

scrapeOtomoto();
