const cheerio = require("cheerio");
const html =
    "<html><body><ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul></body></html>";
const $ = cheerio.load(html);

const list = [];
$("ul li").each((index, element) => {
    const text = $(element).text();
    list.push(text);
});

console.log(list); // Output: ["Item 1", "Item 2", "Item 3"]
