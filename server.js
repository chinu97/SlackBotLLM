const { App } = require('@slack/bolt');
const slackService = require("./app/services/slack/slackService");
const langchainService = require('./app/services/langchain/langchainService');
const mongoose = require("mongoose");

const startServer = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        const langchainInstance = await langchainService.initLangchainClient({embeddingProvider : process.env.VECTOR_EMBEDDINGS_PROVIDER, vectorStoreType : process.env.VECTOR_STORE});
        console.log('✅ LangChain client initialized with Pinecone');

        // Initialize the Slack Bolt app
        const app = new App({
            token: process.env.SLACK_BOT_TOKEN,
            socketMode: true,
            appToken: process.env.SLACK_APP_TOKEN,
            port: process.env.PORT || 3000
        });

        // Set up message handling
        app.message('', async ({ message, client }) => {
            await slackService.processMessage(message, client);
        });
        // Start the Slack app
        await app.start();
        console.log('⚡️ Bolt app is running!');

    } catch (error) {
        console.error('❌ Error starting the app:', error);
    }
};

// Start server
startServer();
