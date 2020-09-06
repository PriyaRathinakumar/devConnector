const mongoose = require('mongoose');

const postsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    text: {
        type: String,
        required: true
    },
    name: {
        type: String //get the name and avatar here itself so no need to hit 'user' to get details
    },
    avatar: {
        type: String
    },
    likes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    }],
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        text: {
            type: String,
            required: true,
        },
        name: {
            type: String
        },
        avatar: {
            type: String
        },
        date: {
            type: Date,
            default: Date.now
        }
    }]
}); 

module.exports = Post = mongoose.model('post', postsSchema);