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

const processMessage = async (message, client) => {
    try {
        console.log('Processing message:', message.ts);

        // Check if the message has already been processed
        const processed = await isMessageProcessed(message.ts);
        if (processed) {
            console.log('Message already processed:', message.ts);
            return;
        }
        const loadingMessage = await client.chat.postMessage({
            channel: message.channel,
            text: 'Processing your request... Please hold on.'
        });
        console.log('Loading message posted:', loadingMessage.ts);

        // Get LLM response
        let llmResponse = await langchainService.processQuery(message.text, message.user);

        // Post initial response and ask for satisfaction
        await client.chat.update({
            channel: message.channel,
            ts: loadingMessage.ts,
            text: llmResponse,
            blocks: [
                {type: 'section', text: {type: 'mrkdwn', text: llmResponse}}
            ]
        });
        await client.chat.postMessage({
            channel: message.channel,
            text: 'Are you satisfied with the response?',
            blocks: [
                {type: 'section', text: {type: 'mrkdwn', text: "Are you satisfied with the response?"}},
                {
                    type: 'actions',
                    elements: [
                        { type: 'button', text: { type: 'plain_text', text: 'Yes' }, action_id: 'satisfaction_yes' },
                        { type: 'button', text: { type: 'plain_text', text: 'No' }, action_id: 'satisfaction_no' }
                    ]
                }
            ]
        });

        await saveProcessedMessage(message);

    } catch (error) {
        console.error('Error handling message:', error.message);
        await client.chat.update({
            channel: message.channel,
            ts: message.ts,
            text: 'An error occurred while processing your request.',
        });
    }
};

const handleSatisfactionYes = async ({body, ack, client}) => {
    await ack(); // Acknowledge the interaction
    const { channel, message } = body;

    try {

        await client.chat.delete({
            channel: channel.id,
            ts: message.ts
        });

    } catch (error) {
        console.error('Error handling "No" button click:', error.message);
    }
}

const handleSatisfactionNo = async ({ body, ack, client }) => {
    await ack(); // Acknowledge the interaction
    const { channel, message } = body;

    try {
        // Prompt to create a Jira ticket

        await client.chat.delete({
            channel: channel.id,
            ts: message.ts
        });

        await client.chat.postMessage({
            channel: channel.id,
            text: 'It seems you are not satisfied. Do you want to create a Jira ticket?',
            blocks: [
                { type: 'section', text: { type: 'mrkdwn', text: "It seems you are not satisfied. Do you want to create a Jira ticket?" } },
                {
                    type: 'actions',
                    elements: [
                        { type: 'button', text: { type: 'plain_text', text: 'Yes' }, action_id: 'create_ticket_yes' },
                        { type: 'button', text: { type: 'plain_text', text: 'No' }, action_id: 'create_ticket_no' }
                    ]
                }
            ]
        });



    } catch (error) {
        console.error('Error handling "No" button click:', error.message);
    }
};

const handleCreateTicketYes = async ({ body, ack, client }) => {
    await ack(); // Acknowledge the interaction
    const { channel, message } = body;

    try {
        // Create a Jira ticket
        const jiraResponse = await jiraService.createJiraTicket('User requested Jira ticket creation', 'additional data if needed');

        // Delete the message with the original buttons
        await client.chat.delete({
            channel: channel.id,
            ts: message.ts
        });

        // Send a confirmation message
        await client.chat.postMessage({
            channel: channel.id,
            text: `Thank you! A Jira ticket has been created: ${jiraResponse.key}`
        });

    } catch (error) {
        console.error('Error handling "Yes" button click:', error.message);
        await client.chat.postMessage({
            channel: channel.id,
            text: 'Sorry, there was an error creating the Jira ticket. Please try again later.'
        });
    }
};

const handleCreateTicketNo = async ({ body, ack, client }) => {
    await ack(); // Acknowledge the interaction
    const { channel, message } = body;

    try {
        // Delete the message with the original buttons
        await client.chat.delete({
            channel: channel.id,
            ts: message.ts
        });

    } catch (error) {
        console.error('Error handling "No" button click:', error.message);
        await client.chat.postMessage({
            channel: channel.id,
            text: 'Sorry, there was an error processing your request. Please try again later.'
        });
    }
};

module.exports = {
    processMessage: processMessage,
    handleSatisfactionYes : handleSatisfactionYes,
    handleSatisfactionNo : handleSatisfactionNo,
    handleCreateTicketYes : handleCreateTicketYes,
    handleCreateTicketNo : handleCreateTicketNo
};
