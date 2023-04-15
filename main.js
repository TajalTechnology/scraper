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
    async loadHtmlContent() {
        const initialHtml = await requestPromise(this.options);
        const $ = cheerio.load(initialHtml);
        return $;
    }

    /**
     *
     * @returns total page number
     */
    async totalPageCount() {
        const [$, pageUrls] = [await this.loadHtmlContent(), []];
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
        } else return url;
    }
}

async function main() {
    const initialUrl =
        "https://www.otomoto.pl/ciezarowe/uzytkowe/mercedes-benz/ od-2014/q-actros? search%5Bfilter_enum_damaged%5D=0&search%5Border%5D=created_at %3Adesc";
    const truck = new Truck();
    // const totalPage = await truck.totalPageCount();
    const nextPageUrl = await truck.getNextPageUrl(initialUrl);
    console.log(nextPageUrl);
}
main();
