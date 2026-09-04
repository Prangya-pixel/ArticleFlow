import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import User from '../models/User.js';
import { createToken } from '../utils/token.js';

const userResponse = (user) => ({ id: user._id, name: user.name, email: user.email, username: user.username || user.email.split('@')[0], bio: user.bio || '', profilePhoto: user.profilePhoto || '', followersCount: user.followersCount || 0, followingCount: user.followingCount || 0, role: user.role });

async function availableUsername(seed) {
  const base = seed.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 24) || 'articleflowuser';
  let username = base.length >= 3 ? base : `${base}user`;
  let suffix = 1;
  while (await User.exists({ username })) username = `${base.slice(0, 24)}${suffix++}`;
  return username;
}

export async function register(req, res, next) {
  try {
    const { name, email, password, role = 'reader' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (!['reader', 'author'].includes(role)) return res.status(400).json({ message: 'Choose reader or author for registration.' });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({ name, email: normalizedEmail, username: await availableUsername(normalizedEmail.split('@')[0]), password: await bcrypt.hash(password, 12), role });
    return res.status(201).json({ token: createToken(user), user: userResponse(user) });
  } catch (error) { next(error); }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid email or password.' });
    return res.json({ token: createToken(user), user: userResponse(user) });
  } catch (error) { next(error); }
}

export function me(req, res) { return res.json({ user: userResponse(req.user) }); }

export async function updateProfile(req, res, next) {
  try {
    const { name, email, username, bio, profilePhoto, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (name !== undefined) {
      if (name.trim().length < 2) return res.status(400).json({ message: 'Name must be at least 2 characters.' });
      user.name = name.trim();
    }
    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return res.status(400).json({ message: 'Please provide a valid email address.' });
      const existing = await User.exists({ email: normalizedEmail, _id: { $ne: user._id } });
      if (existing) return res.status(409).json({ message: 'An account with this email already exists.' });
      user.email = normalizedEmail;
    }
    if (username !== undefined) {
      const normalizedUsername = username.trim().toLowerCase();
      if (!/^[a-z0-9._]{3,30}$/.test(normalizedUsername)) return res.status(400).json({ message: 'Username must be 3–30 characters and use only letters, numbers, dots, or underscores.' });
      const existing = await User.exists({ username: normalizedUsername, _id: { $ne: user._id } });
      if (existing) return res.status(409).json({ message: 'That username is already taken.' });
      user.username = normalizedUsername;
    }
    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > 180) return res.status(400).json({ message: 'Bio must be 180 characters or fewer.' });
      user.bio = bio.trim();
    }
    if (profilePhoto !== undefined) {
      if (typeof profilePhoto !== 'string' || profilePhoto.length > 3_000_000) return res.status(400).json({ message: 'Profile photo is too large. Choose an image under 2 MB.' });
      user.profilePhoto = profilePhoto;
    }
    if (newPassword) {
      if (newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters.' });
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) return res.status(400).json({ message: 'Your current password is incorrect.' });
      user.password = await bcrypt.hash(newPassword, 12);
    }
    await user.save();
    return res.json({ user: userResponse(user) });
  } catch (error) { next(error); }
}

export async function requestPasswordReset(req, res, next) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email address is required.' });
    const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpiresAt');
    // Keep this response identical for existing and non-existing accounts.
    const message = 'If an account exists for that email, a password-reset link has been created.';
    if (!user) return res.json({ message });
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    // Email transport is intentionally not assumed. This makes the flow usable
    // in local development without exposing the token in an API response.
    console.log(`Password reset link for ${user.email}: ${resetLink}`);
    return res.json({ message });
  } catch (error) { next(error); }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Reset token and new password are required.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ passwordResetToken: tokenHash, passwordResetExpiresAt: { $gt: new Date() } }).select('+password +passwordResetToken +passwordResetExpiresAt');
    if (!user) return res.status(400).json({ message: 'This password-reset link is invalid or has expired.' });
    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
    return res.json({ message: 'Your password has been reset. You can now sign in.' });
  } catch (error) { next(error); }
}
