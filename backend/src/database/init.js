import '../config/env.js';
import { connectDatabase } from '../config/database.js';

connectDatabase().then(() => process.exit(0)).catch((error) => { console.error(error.message); process.exit(1); });
