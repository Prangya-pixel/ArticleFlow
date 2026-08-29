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
