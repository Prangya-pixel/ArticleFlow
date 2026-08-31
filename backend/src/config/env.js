import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
// This is the project root, so `npm run dev` always reads ArticleFlow/.env.
dotenv.config({ path: resolve(currentDirectory, '../../../.env') });
