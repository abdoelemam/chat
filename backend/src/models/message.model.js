import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    text: {
        type: String,
    },
    image: {
        type: String,
    },
    isSystem: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

export default Message;
