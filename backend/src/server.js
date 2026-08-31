import './config/env.js';
import cors from 'cors';
import express from 'express';
import { connectDatabase } from './config/database.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ message: 'Something went wrong. Please try again.' }); });

const port = process.env.PORT || 5000;
connectDatabase().then(() => app.listen(port, () => console.log(`ArticleFlow API is running on port ${port}`))).catch((error) => { console.error(`Could not start server: ${error.message}`); process.exit(1); });
