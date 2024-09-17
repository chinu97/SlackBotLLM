// scraper.js
const axios = require('axios');
const cheerio = require('cheerio');
const {URL} = require('url');
const langChainService = require('./services/langchain/langchainService');


const visitedUrls = new Set();
const urlsToVisit = new Set();

const startingUrl = 'https://help.regie.ai';

function getHostname(url) {
    try {
        return new URL(url).hostname;
    } catch (e) {
        return null;
    }
}

function normalizeUrl(url) {
    try {
        const parsedUrl = new URL(url);
        parsedUrl.hash = '';
        return parsedUrl.href;
    } catch (e) {
        return null;
    }
}

function cleanText(text) {
    return text
        .replace(/\n+/g, ' ')
        .replace(/\t+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function fetchPageContent(url) {
    const {data} = await axios.get(url);
    const $ = cheerio.load(data);

    const title = $('title').text();
    const paragraphs = [];

    $('p').each((i, elem) => {
        const cleanedText = cleanText($(elem).text());
        if (cleanedText) {
            paragraphs.push(cleanedText);
        }
    });

    return {title, paragraphs};
}

function extractAndQueueLinks($, baseUrl, startingHostname) {
    $('a').each((i, elem) => {
        let href = $(elem).attr('href');
        if (href) {
            try {
                href = normalizeUrl(new URL(href, baseUrl).href);
                if (getHostname(href) === startingHostname && href && !visitedUrls.has(href) && !urlsToVisit.has(href)) {
                    urlsToVisit.add(href);
                }
            } catch (e) {
                console.error('Error normalizing URL:', e);
            }
        }
    });
}

async function scrapeWebsite(url) {
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl || visitedUrls.has(normalizedUrl)) return;
    visitedUrls.add(normalizedUrl);

    try {
        const {title, paragraphs} = await fetchPageContent(normalizedUrl);

        if (paragraphs.length) {
            await langChainService.storeWebsiteContentInPinecone(normalizedUrl, title, paragraphs);
        }

        const $ = cheerio.load(await axios.get(normalizedUrl).then(res => res.data));
        extractAndQueueLinks($, normalizedUrl, getHostname(startingUrl));

        while (urlsToVisit.size > 0) {
            const nextUrl = urlsToVisit.values().next().value;
            urlsToVisit.delete(nextUrl);
            await scrapeWebsite(nextUrl);
        }

    } catch (error) {
        console.error('Error scraping website:', error);
    }
}

langChainService.initLangchainClient({embeddingProvider : process.env.VECTOR_EMBEDDINGS_PROVIDER, vectorStoreType : process.env.VECTOR_STORE})
    .then(() => {
        console.log("langchain Initialised successfully");
        scrapeWebsite(startingUrl)
            .then(() =>
                console.log(`Url: ${startingUrl} scraped successfully`)
            );
    })
