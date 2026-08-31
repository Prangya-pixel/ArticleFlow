import '../config/env.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import User from '../models/User.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function createAdmin() {
  try {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error(
        'ADMIN_EMAIL and ADMIN_PASSWORD must be configured in .env'
      );
    }

    await connectDatabase();

    const email = ADMIN_EMAIL.trim().toLowerCase();

    const existingAdmin = await User.findOne({ email }).select('+password');

    if (existingAdmin) {
      existingAdmin.name = 'ArticleFlow Admin';
      existingAdmin.password = await bcrypt.hash(ADMIN_PASSWORD, 12);
      existingAdmin.role = 'admin';

      await existingAdmin.save();

      console.log('Existing admin account updated successfully.');
      return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await User.create({
      name: 'ArticleFlow Admin',
      email,
      password: hashedPassword,
      role: 'admin',
    });

    console.log('Admin account created successfully.');
  } finally {
    await mongoose.connection.close();
  }
}

createAdmin().catch((error) => {
  console.error('Failed to create admin:', error.message);
  process.exit(1);
});