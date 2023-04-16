const cheerio = require("cheerio");
const requestPromise = require("request-promise");

class Truck {
    constructor(
        itemId,
        title,
        price,
        registrationDate,
        productionDate,
        mileage,
        power,
        url
    ) {
        this.itemId = Math.round(Number(itemId));
        this.title = title;
        this.price = Math.round(Number(price));
        this.registrationDate = registrationDate;
        this.productionDate = productionDate;
        this.mileage = Math.round(Number(mileage));
        this.power = power;
        this.url = url;
        this.initialUrl =
            "https://www.otomoto.pl/ciezarowe/uzytkowe/mercedes-benz/ od-2014/q-actros? search%5Bfilter_enum_damaged%5D=0&search%5Border%5D=created_at %3Adesc";
        this.options = {
            uri: this.initialUrl,
            transform: (body) => body,
            simple: true,
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            },
        };
    }

    /**
     *
     * @returns $
     */
    async loadHtmlContent(url) {
        this.options.uri = url;
        const initialHtml = await requestPromise(this.options);
        const $ = cheerio.load(initialHtml);
        return $;
    }

    /**
     *
     * @returns total page number
     */
    async totalPageCount(url) {
        const [$, pageUrls] = [await this.loadHtmlContent(url), []];
        $('li[data-testid="pagination-list-item"] a').each(async (i, el) => {
            const pageUrl = $(el).attr("href");
            pageUrls.push(pageUrl);
        });

        const lastPageUrl = await pageUrls[pageUrls.length - 1].split("&");
        for (const element of lastPageUrl) {
            if (element.includes("page=")) return Number(element.split("=")[1]);
        }
        return 0;
    }

    /**
     *
     * @param {*} url
     * @returns Next page url
     */
    async getNextPageUrl(url) {
        const urlSplit = await url.split("&");
        const lastIndex = urlSplit[urlSplit.length - 1];

        if (lastIndex.includes("page=")) {
            const pageNo = Number(lastIndex.split("=")[1]);
            const currentPageQueryString = `page=${pageNo}`;
            const nextPageQueryString = `page=${pageNo + 1}`;
            url = url.replace(`${currentPageQueryString}`, nextPageQueryString);
            return url;
        } else return url + "&page=2";
    }

    /**
     *
     * @returns Array
     */
    async addItems() {
        const [$, urlsAndIds] = [await this.loadHtmlContent(), []];

        $(".ooa-1e8338r > main > article").each((index, element) => {
            const url = $(element).find(".ooa-1nihvj5 > h2 > a").attr("href");
            const id = $(element).attr("data-id");
            urlsAndIds.push({ url, id });
        });

        return urlsAndIds;
    }

    /**
     *
     * @returns Number
     * Count total number of adds in this initial urls
     */
    async getTotalAdsCount() {
        const $ = await this.loadHtmlContent();
        return $(".ooa-1e8338r > main > article").length;
    }

    async scrapeTruckItem(url) {
        const $ = await this.loadHtmlContent(url);
        const items = [];

        $(".ooa-1e8338r > main > article").each(async (index, element) => {
            const itemId = $(element).attr("data-id");
            const price = $(element).find(".eayvfn610 > span").text().trim();
            const date = $(element).find(".ooa-0").text().trim();
            const title = $(element)
                .find(".ooa-1nihvj5 > h2 > a")
                .text()
                .trim();

            const image = $(element)
                .find("div.ooa-1g9tpob img.eayvfn618")
                .attr("src");

            /**
             * Extract Year of production date and mileage
             */
            const description = [];
            $(element)
                .find(".ooa-1nihvj5 > div > ul > li")
                .each((index, element) => {
                    if (!description.includes($(element).text().trim())) {
                        description.push($(element).text().trim());
                    }
                });
            const productionDate = description[0];
            const mileage = description[1];
            const url = $(element).find(".ooa-1nihvj5 > h2 > a").attr("href");

            const data = {
                itemId,
                title,
                price,
                mileage,
                image,
                productionDate,
                registrationDate: date,
            };

            items.push(data);
        });
        return Promise.all(items);
    }

    async allPageAdds(url, totalPage) {
        const pages = Array.from(
            { length: totalPage },
            (_, i) => `${url}&page=${i + 1}`
        );
        const requests = pages.map((pageUrl) => this.scrapeTruckItem(pageUrl));
        const responses = await Promise.all(requests);
        return responses.flat();
        // const items = [];
        // let nextPageUrl = url;
        // for (let index = 0; index < totalPage; index++) {
        //     const itemListInPage = await this.scrapeTruckItem(nextPageUrl);
        //     nextPageUrl = await this.getNextPageUrl(nextPageUrl);
        //     items.push(...itemListInPage);
        // }
        // return Promise.all(items);
    }
}

async function main() {
    const initialUrl =
        "https://www.otomoto.pl/ciezarowe/uzytkowe/mercedes-benz/ od-2014/q-actros? search%5Bfilter_enum_damaged%5D=0&search%5Border%5D=created_at %3Adesc";
    const truck = new Truck();
    const totalPage = await truck.totalPageCount(initialUrl);
    // const nextPageUrl = await truck.getNextPageUrl(initialUrl);
    // const addItems = await truck.addItems();
    // const getTotalAdsCount = await truck.getTotalAdsCount();
    const scrapeTruckItem = await truck.scrapeTruckItem(initialUrl);
    const allPageAdds = await truck.allPageAdds(initialUrl, totalPage);
    console.log(allPageAdds);
}
main();
