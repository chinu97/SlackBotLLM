const axios = require('axios');

const jiraBaseUrl = process.env.JIRA_API_URL;
const jiraAuth = Buffer.from(`${process.env.JIRA_USERNAME}:${process.env.JIRA_API_TOKEN}`).toString('base64');
const jiraProjectKey = process.env.JIRA_PROJECT_KEY;

const createJiraTicket = async (summary, description) => {
    try {
        const response = await axios.post(
            `${jiraBaseUrl}/rest/api/3/issue`,
            {
                fields: {
                    project: { key: jiraProjectKey },
                    summary: summary,
                    description: {
                        version: 1,
                        type: 'doc',
                        content: [
                            {
                                type: 'paragraph',
                                content: [
                                    { type: 'text', text: description }
                                ]
                            }
                        ]
                    },
                    issuetype: { name: "Bug" }
                }
            },
            {
                headers: {
                    'Authorization': `Basic ${jiraAuth}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('Ticket created successfully:', response.data);
        return {
            key: response.data.key,
            id: response.data.id,
            self: response.data.self
        };
    } catch (error) {
        console.error('Error creating Jira ticket:', {
            errorMessages: error.response?.data?.errorMessages || [],
            errors: error.response?.data?.errors || {}
        });
        throw new Error('Failed to create Jira ticket');
    }
};

module.exports = {
    createJiraTicket: createJiraTicket,
};