import User from '../models/User.js';
import Follow from '../models/Follow.js';
import Notification from '../models/Notification.js';

export async function toggleFollow(req, res, next) {
  try {
    const targetId = req.params.id;
    if (String(targetId) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot follow yourself.' });
    }
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found.' });

    const existing = await Follow.findOne({ follower: req.user._id, following: targetId });

    if (existing) {
      await Follow.deleteOne({ _id: existing._id });
      await User.updateOne({ _id: targetId }, { $inc: { followersCount: -1 } });
      await User.updateOne({ _id: req.user._id }, { $inc: { followingCount: -1 } });
      return res.json({ following: false });
    }

    await Follow.create({ follower: req.user._id, following: targetId });
    await User.updateOne({ _id: targetId }, { $inc: { followersCount: 1 } });
    await User.updateOne({ _id: req.user._id }, { $inc: { followingCount: 1 } });

    await Notification.create({
      recipient: targetId,
      type: 'FOLLOWED',
      message: `${req.user.name} started following you.`
    });

    return res.json({ following: true });
  } catch (error) { next(error); }
}

export async function getFollowStatus(req, res, next) {
  try {
    const existing = await Follow.findOne({ follower: req.user._id, following: req.params.id });
    return res.json({ following: !!existing });
  } catch (error) { next(error); }
}