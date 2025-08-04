const mongoose = require('mongoose');

// Schema for global website data
const webSchema = new mongoose.Schema({
    name: {
        type: String,
        default: 'WBK PayGateway'
    },
    iconUrl: {
        type: String,
        default: 'https://avatars.githubusercontent.com/u/99401498?v=4'
    },
    popupNotifications: [{
        message: String,
        type: { type: String, enum: ['info', 'success', 'warning', 'danger'], default: 'info' },
        isActive: { type: Boolean, default: true }
    }],
    total_user: {
        type: Number,
        default: 0
    }
});

// Singleton pattern to ensure only one web document exists
webSchema.statics.getSingleton = async function() {
    let data = await this.findOne();
    if (!data) {
        data = await this.create({});
    }
    return data;
};

module.exports = mongoose.model('Web', webSchema);