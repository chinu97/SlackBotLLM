const Redis = require('ioredis');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { RunnableSequence, RunnablePassthrough } = require('@langchain/core/runnables');

class LangchainClient {
    static instance = null;

    constructor(vectorDbStore, llm, promptTemplate = null) {
        if (LangchainClient.instance) {
            return LangchainClient.instance;
        }

        this.vectorDbStore = vectorDbStore;
        this.llm = llm;
        this.redis = new Redis();

        this.prompt = promptTemplate || ChatPromptTemplate.fromMessages([
            [
                "system",
                "You are a helpful assistant. Use the following context and conversation history to answer the user's question. If the context does not provide an answer, use your own knowledge and reasoning."
            ],
            [
                "human",
                "{history}\nContext: {context}\n\nQuestion: {question}"
            ]
        ]);

        LangchainClient.instance = this;

        console.log('LangChainClient initialized with Redis.');
    }

    static getInstance(vectorDbStore, llm, promptTemplate = null) {
        if (!LangchainClient.instance) {
            LangchainClient.instance = new LangchainClient(vectorDbStore, llm, promptTemplate);
        }
        return LangchainClient.instance;
    }

    async getResponse(query, userId) {
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
                const historyKey = `conversation_history:${userId}`;
                const historyString = await this.redis.get(historyKey) || '';

                // Update conversation history
                const updatedHistory = `${historyString}\nUser: ${input.question.question}`;
                await this.redis.set(historyKey, updatedHistory);

                return { ...input, question: input?.question?.question, history: updatedHistory };
            },
            this.prompt,
            this.llm,
            async (output) => {
                const content = output?.content;
                const historyKey = `conversation_history:${userId}`;
                await this.redis.set(historyKey, `${await this.redis.get(historyKey) || ''}\nAssistant: ${content}`);

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

}

module.exports = LangchainClient;
