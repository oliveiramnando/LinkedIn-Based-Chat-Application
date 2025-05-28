const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    linkedinId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String, 
        required: true,
        unique: true
    },
    profilePicture: {
        type: String // url to linkedin avatar
    }
}, { 
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);