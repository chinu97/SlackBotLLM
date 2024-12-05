const mongoose = require('mongoose');

const slackMessageSchema = new mongoose.Schema({
    messageId: { type: String, unique: true, required: true },
    userId: { type: String, required: true },
    channelId: { type: String, required: true },
    timestamp: { type: String, required: true },
    processedAt: { type: Date, default: Date.now }
});

const SlackMessage = mongoose.model('SlackMessage', slackMessageSchema);

module.exports = SlackMessage;
