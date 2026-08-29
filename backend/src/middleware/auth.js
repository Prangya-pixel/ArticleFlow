import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.slice(7);
    if (!token) return res.status(401).json({ message: 'Authentication is required.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'This account no longer exists.' });
    req.user = user;
    return next();
  } catch { return res.status(401).json({ message: 'Your session is invalid or has expired.' }); }
}

export const allowRoles = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'You do not have permission to perform this action.' });
