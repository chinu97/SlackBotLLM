const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { RunnableSequence, RunnablePassthrough } = require('@langchain/core/runnables');

class LangchainClient {
    static instance = null;

    constructor(vectorDbStore, llm, promptTemplate = null, actionHandlers = {}) {
        if (LangchainClient.instance) {
            return LangchainClient.instance;
        }

        this.vectorDbStore = vectorDbStore;
        this.llm = llm;
        this.actionHandlers = actionHandlers; // Object that maps action keys to handler functions
        this.prompt = promptTemplate || ChatPromptTemplate.fromMessages([
            ["system", "You are a helpful Slack assistant. Use the following context to answer the user's question. If you can't find a relevant answer in the context, respond with 'JIRA_TICKET_NEEDED' followed by a brief explanation of why a Jira ticket should be created."],
            ["human", "Context: {context}\n\nQuestion: {question}"]
        ]);

        LangchainClient.instance = this;

        console.log('LangChainClient initialized.');
    }

    static getInstance(vectorDbStore, llm, promptTemplate = null, actionHandlers = {}) {
        if (!LangchainClient.instance) {
            LangchainClient.instance = new LangchainClient(vectorDbStore, llm, promptTemplate, actionHandlers);
        }
        return LangchainClient.instance;
    }

    async getResponse(query) {
        console.log('Starting response generation for query:', query);

        const ragChain = RunnableSequence.from([
            {
                question: new RunnablePassthrough(),
                context: async (input) => {
                    try {
                        const results = await this.vectorDbStore.similaritySearch(input.question, 10);
                        console.log('Similarity search completed. Number of results:', results.length);
                        const context = results.map(match => match.pageContent).join('\n');
                        return context;
                    } catch (error) {
                        console.error('Error during similarity search:', error.message);
                        return "Error retrieving information from the knowledge base.";
                    }
                },
            },
            async (input) => {
                return { ...input, question: input?.question?.question };
            },
            this.prompt,
            this.llm,
            async (output) => {
                let content = output?.content;
                if (content.includes('JIRA_TICKET_NEEDED')) {
                    console.log('Action: Creating Jira ticket');
                    content = await this.executeAction('createJiraTicket', content, query);
                }
                return content;
            }
        ]);

        try {
            const response = await ragChain.invoke({ question: query });
            console.log('Response generated successfully from ragchain.');
            return response;
        } catch (error) {
            console.error('Error during response generation:', error.message);
            return "Error generating response.";
        }
    }

    async saveData(data, metadata, params) {
        try {
            const document = { pageContent: data, metadata: metadata };
            await this.vectorDbStore.addDocuments([document], params);
            console.log('Data saved successfully.');
        } catch (error) {
            console.error('Error saving data to vector store:', error.message);
        }
    }

    async executeAction(action, content, query) {
        if (this.actionHandlers[action]) {
            try {
                return await this.actionHandlers[action](content, query);
            } catch (error) {
                console.error(`Error executing action ${action}:`, error.message);
            }
        } else {
            console.log(`No handler defined for action: ${action}`);
        }
        return content;
    }
}

module.exports = LangchainClient;
