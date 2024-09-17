const { Pinecone } = require('@pinecone-database/pinecone');
const _ = require("lodash")
class PineconeClient {
    static instance = null;
    constructor() {
        if (PineconeClient.instance) {
            return PineconeClient.instance;
        }

        this.pinecone = new Pinecone({
            apiKey : process.env.PINECONE_API_KEY
        });
        PineconeClient.instance = this;
    }

    static getInstance() {
        if (!PineconeClient.instance) {
            PineconeClient.instance = new PineconeClient();
        }
        return PineconeClient.instance;
    }

    async getExistingIndexes () {
        const existingIndexesData = await this.pinecone.listIndexes();
        return _.map(existingIndexesData.indexes, (index)=>index.name);
    }

    async createIndex(indexName, dimension = 1536, metric = 'cosine') {
        try {
            await this.pinecone.createIndex({
                name: indexName,
                dimension: dimension,
                metric: metric,
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1'
                    }
                }
            });
            console.log(`Index "${indexName}" created successfully.`);
        } catch (error) {
            console.error('Error creating index:', error);
        }
    }
}

module.exports = PineconeClient;
