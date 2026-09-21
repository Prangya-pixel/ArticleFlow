import dotenv from 'dotenv';
import dns from 'node:dns';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
// This is the project root, so `npm run dev` always reads ArticleFlow/.env.
dns.setServers(['1.1.1.1', '8.8.8.8']);
dotenv.config({ path: resolve(currentDirectory, '../../../.env') });
