const { App } = require('@slack/bolt');
const mongoose = require("mongoose");
const slackService = require("./app/services/slack/slackService");
const langchainService = require('./app/services/langchain/langchainService');

const startServer = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Initialize LangChain client
        const langchainInstance = await langchainService.initLangchainClient({
            embeddingProvider: process.env.VECTOR_EMBEDDINGS_PROVIDER,
            vectorStoreType: process.env.VECTOR_STORE
        });
        console.log('✅ LangChain client initialized');

        // Initialize Slack Bolt app
        const app = new App({
            token: process.env.SLACK_BOT_TOKEN,
            socketMode: true,
            appToken: process.env.SLACK_APP_TOKEN,
            port: process.env.PORT || 3000
        });

        // Set up message handling
        app.message('', async ({message, client}) => {
            try {
                await slackService.processMessage(message, client);
            } catch (error) {
                console.error('Error processing message:', error.message);
                await client.chat.postMessage({
                    channel: message.channel,
                    text: 'Sorry, there was an error processing your request. Please try again later.'
                });
            }
        });

        // Handle button clicks
        app.action('satisfaction_yes', slackService.handleSatisfactionYes);
        app.action('satisfaction_no', slackService.handleSatisfactionNo);
        app.action('create_ticket_yes', slackService.handleCreateTicketYes);
        app.action('create_ticket_no', slackService.handleCreateTicketNo);

        // Handle errors globally
        app.error(async (error) => {
            console.error('Global error handler:', error);
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
