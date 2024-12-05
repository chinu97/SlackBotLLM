const jiraService = require("./jira/jiraService");

const createJiraTicket = async (response, messageText) => {
    try {
        console.log('Creating Jira ticket for message:', messageText);
        const ticketReason = response.replace('JIRA_TICKET_NEEDED', '').trim();
        const jiraTicket = await jiraService.createJiraTicket(messageText, ticketReason);
        const resultMessage = `I don't have enough information to answer that question. A Jira ticket has been created to address this: ${jiraTicket.key}. Reason: ${ticketReason}`;
        console.log('Jira ticket created:', jiraTicket.key);
        return resultMessage;
    } catch (error) {
        console.error('Error handling LLM response:', error.message);
        throw error;
    }
};

const actionHandlers = {
    "createJiraTicket" : createJiraTicket
};

module.exports = {
    actionHandlers
};
