const { PineconeStore : LangchainPineconeStore } = require('@langchain/pinecone');
const { Pinecone } = require('@pinecone-database/pinecone');
const VectorDbStore = require('./vectorDbStore');

class PineconeStore extends VectorDbStore {
    constructor(embeddings) {
        super();
        this.pineconeClient = new Pinecone();
        this.pineconeIndex = this.pineconeClient.Index(process.env.PINECONE_INDEX);
        this.vectorStore = new LangchainPineconeStore(embeddings, { pineconeIndex: this.pineconeIndex });
    }

    async similaritySearch(query, numResults) {
        return await this.vectorStore.similaritySearch(query, numResults);
    }

    async addDocuments(documents, params) {
        return await this.vectorStore.addDocuments(documents, params);
    }
}

module.exports = PineconeStore;
