const PineconeClient = require("./pineconeClient");
const pineconeInstance = PineconeClient.getInstance();

const _ = require("lodash");

const checkAndCreatePineconeIndex = async function (indexName) {
    const existingIndexes = await pineconeInstance.getExistingIndexes();
    if (_.includes(existingIndexes, indexName)) {
        console.log(`Index "${indexName}" already exists.`);
        return;
    }
    await pineconeInstance.createIndex(indexName);
}


module.exports = {
    checkAndCreatePineconeIndex : checkAndCreatePineconeIndex,
};
