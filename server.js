const request = require("request-promise");

async function getHtmlContent(url) {
    const options = {
        uri: url,
        transform: (body) => body,
        simple: true,
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
        },
    };

    try {
        const html = await request(options);
        return html;
    } catch (err) {
        console.error(err);
    }
}

async function main() {
    const html = await getHtmlContent("https://www.otomoto.pl/");
}
main();
