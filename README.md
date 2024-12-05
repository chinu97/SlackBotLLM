Slack Bot with LangChain Integration


Overview
This project is a Slack bot that integrates with LangChain to provide intelligent responses based on a knowledge base stored in Pinecone. The bot listens to messages in Slack, processes them using LangChain, and creates Jira tickets if it cannot provide a relevant answer.

Features
Slack Integration: Listens to and responds to messages in Slack.
LangChain Integration: Uses LangChain to process queries and generate responses.
Pinecone for Vector Search: Stores and retrieves embeddings from Pinecone
Jira Integration: Creates Jira tickets when relevant information is not found.

Prerequisites
Node.js (v18 or higher)
MongoDB
Pinecone Account
Jira Account
Slack App with Bot Token and App Token

Installation
1. Clone the Repository:
git clone https://github.com/chinu97/SlackBot.git

2. cd SlackBot
Install Dependencies:
npm install


3. Set Up Environment Variables:
Create a .env file in the root directory and add the following environment variables:
SLACK_BOT_TOKEN=your-slack-bot-token
SLACK_APP_TOKEN=your-slack-app-token
OPENAI_API_KEY=your-openai-api-key
OPENAI_GPT_MODEL=your-openai-model
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX=your-pinecone-index
MONGODB_URI=your-mongodb-uri
Initialize Pinecone Index

4. Make sure to initialize your Pinecone index by running the appropriate script or command.

5. Usage
Start the Server:
node server.js

Interact with the Bot:

Send messages to the Slack channel where the bot is active.
The bot will process the messages and respond with answers or create Jira tickets if necessary.
During processing, the bot will display a loading message to inform users that their request is being handled.

Acknowledgements
LangChain
Pinecone
Jira
Slack API
