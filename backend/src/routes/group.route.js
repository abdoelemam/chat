import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { addMembers, createGroup, leaveGroup, removeMember, updateGroup } from '../controllers/group.controller.js';

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.put("/:groupId/add-members", protectRoute, addMembers);
router.put("/:groupId/remove-member", protectRoute, removeMember);
router.put("/:groupId/update", protectRoute, updateGroup);
router.delete("/:groupId/leave", protectRoute, leaveGroup);

export default router;
