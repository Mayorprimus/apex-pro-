import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sb, sbSingle, applyCors } from '../_lib/shared';

// GET /api/payment-settings
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const settings = await sbSingle<any>(`payment_settings?select=*&limit=1`);
    return res.json(settings || {});
  } catch (err: any) {
    console.error('[PAYMENT SETTINGS ERROR]', err);
    return res.status(500).json({ error: err?.message || 'Failed to fetch payment settings' });
  }
}