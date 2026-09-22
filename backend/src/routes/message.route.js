import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { getConversations, getMessages, getUsers, sendMessage } from '../controllers/message.controller.js';

const router = express.Router();

router.get("/users", protectRoute, getUsers);
router.get("/conversations", protectRoute, getConversations);
router.get("/:conversationId", protectRoute, getMessages);

router.post("/send/:conversationId", protectRoute, sendMessage);

export default router;
