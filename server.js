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
            transform: (body) => body,
            simple: true,
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            },
        };

        this.loadInitialPage = this.loadHtmlContent(this.initialUrl);
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
     * @returns Numbers
     */
    async totalPageCount() {
        const $ = await this.loadInitialPage;
        const lastPageUrl = $('li[data-testid="pagination-list-item"] a')
            .last()
            .attr("href");

        const totalPageCount = lastPageUrl
            ? Number(lastPageUrl.split("page=")[1])
            : 0;

        return totalPageCount;
    }

    /**
     *
     * @param {*} url
     * @returns url {String} as a modified url
     */
    async getNextPageUrl(url) {
        const regex = /page=(\d+)/;
        const match = url.match(regex);
        if (match) {
            const currentPage = Number(match[1]);
            const nextPage = currentPage + 1;
            return url.replace(regex, `page=${nextPage}`);
        } else {
            return url + (url.includes("?") ? "&" : "?") + "page=2";
        }
    }

    /**
     * Retrieves a list of items from a web page and returns an array of objects containing the URL and ID for each item.
     * @returns {Array} An array of objects containing the URL and ID for each item.
     */
    async addItems() {
        const [$, urlsAndIds] = [await this.loadInitialPage, []];

        $(".ooa-1e8338r > main > article").each((index, element) => {
            const url = $(element).find(".ooa-1nihvj5 > h2 > a").attr("href");
            const id = $(element).attr("data-id");
            urlsAndIds.push({ url, id });
        });

        return urlsAndIds;
    }

    /**
     * @returns {Promise<number>} - Total number of ads in the initial URLs
     */
    async getTotalAdsCount() {
        const $ = await this.loadInitialPage;
        return $(".ooa-1e8338r > main > article").length;
    }

    async scrapeTruckItem() {
        const [$, items] = [await this.loadInitialPage, []];

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
    }

    async main() {
        const initialUrl =
            "https://www.otomoto.pl/ciezarowe/uzytkowe/mercedes-benz/ od-2014/q-actros? search%5Bfilter_enum_damaged%5D=0&search%5Border%5D=created_at %3Adesc";

        const totalPage = await this.totalPageCount(initialUrl);
        const nextPageUrl = await this.getNextPageUrl(initialUrl);
        const addItems = this.addItems();
        const getTotalAdsCount = await this.getTotalAdsCount();
        const scrapeTruckItem = await this.scrapeTruckItem();
        const allPageAdds = await this.allPageAdds(initialUrl, totalPage);

        /**
         * Print all functions output
         */
        console.log(
            totalPage,
            nextPageUrl,
            addItems,
            getTotalAdsCount,
            scrapeTruckItem,
            allPageAdds
        );
    }
}

const truck = new Truck();
truck.main();
