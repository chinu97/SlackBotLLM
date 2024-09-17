const slackRepository = require("../../repository/slack/slackRepository");
const langchainService = require("../langchain/langchainService");
const jiraService = require("../jira/jiraService");

async function isMessageProcessed(messageId) {
    try {
        console.log('Checking if message has been processed:', messageId);
        const message = await slackRepository.findMessageById(messageId);
        const isProcessed = !!message;
        console.log('Message processed status:', isProcessed);
        return isProcessed;
    } catch (error) {
        console.error('Error checking message processed status:', error.message);
        throw error;
    }
}

async function saveProcessedMessage(message) {
    try {
        console.log('Saving processed message:', message.ts);
        await slackRepository.saveMessage(message);
        console.log('Message saved successfully:', message.ts);
    } catch (error) {
        console.error('Error saving processed message:', error.message);
        throw error;
    }
}

const handleLLMResponse = async (response, messageText) => {
    try {
        if (response.startsWith('JIRA_TICKET_NEEDED')) {
            console.log('Creating Jira ticket for message:', messageText);
            const ticketReason = response.replace('JIRA_TICKET_NEEDED', '').trim();
            const jiraTicket = await jiraService.createJiraTicket(messageText, ticketReason);
            const resultMessage = `I don't have enough information to answer that question. A Jira ticket has been created to address this: ${jiraTicket.key}. Reason: ${ticketReason}`;
            console.log('Jira ticket created:', jiraTicket.key);
            return resultMessage;
        }
        return response;
    } catch (error) {
        console.error('Error handling LLM response:', error.message);
        throw error;
    }
};

const processMessage = async (message, client) => {
    try {
        console.log('Processing message:', message.ts);

        // Check if the message has already been processed
        const processed = await isMessageProcessed(message.ts);
        if (processed) {
            console.log('Message already processed:', message.ts);
            return;
        }

        console.log('Posting loading message to channel:', message.channel);
        const loadingMessage = await client.chat.postMessage({
            channel: message.channel,
            text: 'Processing your request... Please hold on.',
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: 'Processing your request... Please hold on.'
                    }
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: ':hourglass_flowing_sand: Please wait while we process your request.'
                    }
                }
            ]
        });
        console.log('Loading message posted:', loadingMessage.ts);
        let llmResponse = await langchainService.processQuery(message.text);

        // Handle Jira ticket creation if needed
        llmResponse = await handleLLMResponse(llmResponse, message.text);

        // Update the initial message with the final response
        console.log('Updating loading message with final response');
        await client.chat.update({
            channel: message.channel,
            ts: loadingMessage.ts,
            text: llmResponse,
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: llmResponse
                    }
                }
            ]
        });

        // Save the processed message
        await saveProcessedMessage(message);

    } catch (error) {
        console.error('Error handling message:', error.message);
        await client.chat.update({
            channel: message.channel,
            ts: message.ts,
            text: 'An error occurred while processing your request.',
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: 'An error occurred while processing your request.'
                    }
                }
            ]
        });
    }
};

module.exports = {
    processMessage : processMessage
};
