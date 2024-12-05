const SlackMessage = require('../../models/slack/slackMessage');

async function findMessageById(messageId) {
    return SlackMessage.findOne({ messageId });
}

async function saveMessage(message) {
    const newMessage = new SlackMessage({
        messageId: message.ts,
        userId: message.user,
        channelId: message.channel,
        timestamp: message.ts,
    });
    return newMessage.save();
}

module.exports = {
    findMessageById : findMessageById,
    saveMessage : saveMessage
};
