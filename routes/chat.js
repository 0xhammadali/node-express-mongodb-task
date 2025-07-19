const express = require('express');
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

const router = express.Router();

// GET /api/chat/conversation/:userId
router.get('/conversation/:userId', auth, async (req, res) => {
    console.log("conversation/:userId");
  try {
    const otherUserId = req.params.userId;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const otherUser = await User.findById(otherUserId);
    console.log("user",user);
    console.log("otherUser",otherUser);
    // if (!user || !otherUser) {
    //   return res.status(404).json({ msg: 'User not found' });
    // }

    // // Conversations only allowed between different roles
    // if (user.role === otherUser.role) {
    //   return res.status(403).json({ msg: 'Conversation not allowed between same roles' });
    // }

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    }).sort({ timestamp: 1 });
    console.log("messages",messages);
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET /api/chat/online
router.get('/online', auth, async (req, res) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const users = await User.find({ lastLogin: { $gte: oneHourAgo } }).select('name role lastLogin');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET /api/chat/fan-stack => list fans ordered by most recent message to player
router.get('/fan-stack', auth, async (req, res) => {
  try {
    const playerId = req.user.id;
    console.log("player id",req.user.id)
    const player = await User.findById(playerId);
    console.log("player",player);
    if (!player || player.role !== 'player') {
      return res.status(403).json({ msg: 'Only players can access fan stack' });
    }

    // fetch all messages from fans to this player, newest first
    const stack = await Message.find({ receiver: playerId })
      .sort({ timestamp: -1 })
      .populate({ path: 'sender', select: 'name role', match: { role: 'fan' } })
      .lean();

    // Filter out any documents where sender population failed (non-fan)
    const fanMessages = stack
      .filter((doc) => doc.sender)
      .map((doc) => ({
        fanId: doc.sender._id,
        name: doc.sender.name,
        message: doc.message,
        at: doc.timestamp,
      }));

    return res.json(fanMessages);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router; 