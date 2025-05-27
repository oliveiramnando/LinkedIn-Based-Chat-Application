const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,    // stores mongodb objectid pointing to another document
        ref: 'User',                    // refers to user collection
        required: true,                 // must be present when saving a meessage 
        index: true                     // 
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

messageSchema.index({ sender: 1, receiver: 1, timestamp: 1});

module.exports = mongoose.model('Message', messageSchema);