import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSupabaseAdmin, authMiddleware, adminMiddleware, applyCors } from '../_lib/shared';

// GET  /api/admin?action=users
// POST /api/admin?action=adjust-balance | set-trend | update-payment-settings | update-user-status
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  const action = req.query.action as string;

  const user = await authMiddleware(req, res);
  if (!user) return;
  const admin = await adminMiddleware(req, res);
  if (!admin) return;

  try {
    if (action === 'users' && req.method === 'GET') {
      const client = createSupabaseAdmin();
      const { data: users, error } = await client.from('users')
        .select('id, name, email, balance, status, verified, is_admin, joined, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(users || []);
    }

    if (action === 'adjust-balance' && req.method === 'POST') {
      const { userId, amount } = req.body;
      if (!userId || typeof amount !== 'number') return res.status(400).json({ error: 'Missing userId or amount' });

      const client = createSupabaseAdmin();
      const { data: targetUser, error: fetchError } = await client.from('users').select('balance').eq('id', userId).single();
      if (fetchError || !targetUser) return res.status(404).json({ error: 'User not found' });

      const newBalance = Math.max(0, (targetUser.balance || 0) + amount);
      const { data: updated, error } = await client.from('users')
        .update({ balance: newBalance }).eq('id', userId).select().single();
      if (error) throw error;

      const { password_hash, ...safeUser } = updated;
      return res.json(safeUser);
    }

    if (action === 'set-trend' && req.method === 'POST') {
      const { assetId, trend, trendRate } = req.body;
      if (!assetId || !trend) return res.status(400).json({ error: 'Missing assetId or trend' });
      const validTrends = ['RANDOM', 'PUMP', 'DUMP', 'STABLE'];
      if (!validTrends.includes(trend)) return res.status(400).json({ error: 'Invalid trend' });

      const client = createSupabaseAdmin();
      const updateData: any = { trend };
      if (typeof trendRate === 'number') updateData.trend_rate = trendRate;

      const { data: asset, error } = await client.from('assets')
        .update(updateData).eq('id', assetId).select().single();
      if (error) throw error;
      if (!asset) return res.status(404).json({ error: 'Asset not found' });
      return res.json(asset);
    }

    if (action === 'update-payment-settings' && req.method === 'POST') {
      const settings = req.body;
      const client = createSupabaseAdmin();
      const { data: existing } = await client.from('payment_settings').select('id').limit(1).single();

      let result;
      if (existing) {
        const { data, error } = await client.from('payment_settings')
          .update({ ...settings, updated_at: new Date().toISOString() }).eq('id', existing.id).select().single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await client.from('payment_settings')
          .insert({ ...settings, updated_at: new Date().toISOString() }).select().single();
        if (error) throw error;
        result = data;
      }
      return res.json(result);
    }

    if (action === 'update-user-status' && req.method === 'POST') {
      const { userId, status, verified } = req.body;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });

      const client = createSupabaseAdmin();
      const updateData: any = {};
      if (status) updateData.status = status;
      if (typeof verified === 'boolean') updateData.verified = verified;

      const { data: updated, error } = await client.from('users')
        .update(updateData).eq('id', userId).select().single();
      if (error) throw error;
      if (!updated) return res.status(404).json({ error: 'User not found' });

      const { password_hash, ...safeUser } = updated;
      return res.json(safeUser);
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[ADMIN ERROR]', action, err);
    return res.status(500).json({ error: err?.message || 'Admin request failed' });
  }
}