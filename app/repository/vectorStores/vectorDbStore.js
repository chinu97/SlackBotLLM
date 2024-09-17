class VectorDbStore {
    constructor() {
        if (new.target === VectorDbStore) {
            throw new TypeError("Cannot construct VectorDbStore instances directly.");
        }
    }

    async similaritySearch(query, numResults) {
        throw new Error('Method not implemented.');
    }

    async addDocuments(documents) {
        throw new Error('Method not implemented.');
    }
}

module.exports = VectorDbStore;
