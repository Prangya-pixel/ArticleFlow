import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'] },
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true, match: [/^[a-z0-9._]{3,30}$/, 'Username may use letters, numbers, dots, and underscores.'] },
  bio: { type: String, trim: true, maxlength: 180, default: '' },
  profilePhoto: { type: String, default: '' },
  followersCount: { type: Number, default: 0, min: 0 },
  followingCount: { type: Number, default: 0, min: 0 },
  savedArticles: { type: [String], ref: 'Article', default: [] },
  password: { type: String, required: true, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
  role: { type: String, enum: ['reader', 'author', 'admin'], default: 'reader' },
}, { timestamps: true, versionKey: false });

export default mongoose.model('User', userSchema);
