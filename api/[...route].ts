// Catch-all API route: maps /api/* -> single handler in ./index
// Keeps us at 2 serverless functions (well under the Vercel Hobby limit).
export { default } from './index';
