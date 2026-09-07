import User from '../models/User.js';
import Message from '../models/Message.js';

export async function getUsers(req, res) {
  try {
    const users = await User.find(
      { _id: { $ne: req.user._id } },
      { name: 1, email: 1, role: 1 }
    ).sort({ name: 1 });

    return res.json(users);
  } catch {
    return res.status(500).json({ message: 'Unable to load users.' });
  }
}

export async function getConversation(req, res) {
  try {
    const userId = req.params.userId;

    const otherUser = await User.findById(userId, {
      name: 1,
      email: 1,
      role: 1
    });

    if (!otherUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email')
      .populate('receiver', 'name email');

    await Message.updateMany(
      {
        sender: userId,
        receiver: req.user._id,
        readAt: null
      },
      {
        $set: { readAt: new Date() }
      }
    );

    return res.json({
      user: otherUser,
      messages
    });
  } catch {
    return res.status(500).json({ message: 'Unable to load conversation.' });
  }
}

export async function sendMessage(req, res) {
  try {
    const receiverId = req.params.userId;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (req.user._id.toString() === receiverId) {
      return res.status(400).json({ message: 'You cannot message yourself.' });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      text: text.trim()
    });

    await message.populate('sender', 'name email');
    await message.populate('receiver', 'name email');

    return res.status(201).json(message);
  } catch {
    return res.status(500).json({ message: 'Unable to send message.' });
  }
}