import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../_lib/shared';

// GET /api/health
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  return res.json({ ok: true, timestamp: new Date().toISOString(), supabase: 'https://smnvuvyybhliwrtgqdgx.supabase.co' });
}
