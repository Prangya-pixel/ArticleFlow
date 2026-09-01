import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { createToken } from '../utils/token.js';

const userResponse = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });

export async function register(req, res, next) {
  try {
    const { name, email, password, role = 'reader' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (!['reader', 'author'].includes(role)) return res.status(400).json({ message: 'Choose reader or author for registration.' });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({ name, email: normalizedEmail, password: await bcrypt.hash(password, 12), role });
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
    const { name, email, currentPassword, newPassword } = req.body;
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
    if (newPassword) {
      if (newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters.' });
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) return res.status(400).json({ message: 'Your current password is incorrect.' });
      user.password = await bcrypt.hash(newPassword, 12);
    }
    await user.save();
    return res.json({ user: userResponse(user) });
  } catch (error) { next(error); }
}
