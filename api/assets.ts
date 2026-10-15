import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, simulateAssetUpdates, applyCors } from '../_lib/shared';

let cachedAssets: any[] | null = null;
let lastUpdate = 0;

// GET /api/assets
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data: assets, error } = await supabaseAdmin.from('assets').select('*').order('symbol');
    if (error) throw error;

    const now = Date.now();
    if (!cachedAssets || now - lastUpdate > 2000) {
      cachedAssets = simulateAssetUpdates(assets || []);
      lastUpdate = now;
      for (const asset of cachedAssets) {
        supabaseAdmin.from('assets').update({
          price: asset.price, change_24h: asset.change_24h,
          sparkline: asset.sparkline, updated_at: new Date().toISOString()
        }).eq('id', asset.id);
      }
    }
    return res.json(cachedAssets || assets || []);
  } catch (err: any) {
    console.error('[ASSETS ERROR]', err);
    return res.status(500).json({ error: err?.message || 'Failed to fetch assets' });
  }
}
