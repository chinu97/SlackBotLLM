const LangChainClient = require("./langchainClient");
const PineconeStore = require("../../repository/vectorStores/pineconeStore");
const {OpenAIEmbeddings, ChatOpenAI} = require("@langchain/openai");
const pineconeService = require("../pinecone/pineconeService");
const actions = require("../actionHandlers");
let langchainInstance = null;
const initLangchainClient = async (options = {}) => {
    const {embeddingProvider, vectorStoreType} = options;

    let embeddings;
    let llm;
    switch (embeddingProvider) {
        case 'openai':
        default:
            embeddings = new OpenAIEmbeddings({apiKey: process.env.OPENAI_API_KEY});
            llm = new ChatOpenAI({ model: process.env.OPENAI_GPT_MODEL, temperature: 0 });
            break;
    }
    let vectorStore;
    switch (vectorStoreType) {
        case 'pinecone':
        default:
            vectorStore = new PineconeStore(embeddings);
            await pineconeService.checkAndCreatePineconeIndex(process.env.PINECONE_INDEX);
            break;
    }
    langchainInstance = LangChainClient.getInstance(vectorStore, llm);
    return langchainInstance;
};

const processQuery = async function (query, userId) {
    try {
        return await langchainInstance.getResponse(query, userId);
    } catch (error) {
        console.error('Error processing query:', error);
        return "An error occurred while processing the query.";
    }
};

const storeWebsiteContentInPinecone = async function (normalizedUrl, title, paragraphs) {
    try {
        const content = [normalizedUrl, title].concat(paragraphs).join("\n");
        const metadata = {title, url: normalizedUrl, text: paragraphs.join("\n")};
        await langchainInstance.saveData(content, metadata, {ids: [normalizedUrl]});
        console.log('Stored embedding for:', normalizedUrl);
    } catch (error) {
        console.error('Error storing website content in Pinecone:', error);
    }
}

module.exports = {
    processQuery: processQuery,
    storeWebsiteContentInPinecone: storeWebsiteContentInPinecone,
    initLangchainClient: initLangchainClient
}
