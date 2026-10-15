import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sb, sbSingle, authMiddleware, adminMiddleware, applyCors } from '../_lib/shared';

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
      const users = await sb<any[]>(`users?select=id,name,email,balance,status,verified,is_admin,joined,created_at&order=created_at.desc`);
      return res.json(users || []);
    }

    if (action === 'adjust-balance' && req.method === 'POST') {
      const { userId, amount } = req.body;
      if (!userId || typeof amount !== 'number') return res.status(400).json({ error: 'Missing userId or amount' });

      const targetUser = await sbSingle<any>(`users?select=balance&id=eq.${userId}`);
      if (!targetUser) return res.status(404).json({ error: 'User not found' });

      const newBalance = Math.max(0, (targetUser.balance || 0) + amount);
      const updated = await sbSingle<any>(`users?id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ balance: newBalance })
      });
      if (!updated) throw new Error('Failed to update balance');

      const { password_hash, ...safeUser } = updated;
      return res.json(safeUser);
    }

    if (action === 'set-trend' && req.method === 'POST') {
      const { assetId, trend, trendRate } = req.body;
      if (!assetId || !trend) return res.status(400).json({ error: 'Missing assetId or trend' });
      const validTrends = ['RANDOM', 'PUMP', 'DUMP', 'STABLE'];
      if (!validTrends.includes(trend)) return res.status(400).json({ error: 'Invalid trend' });

      const updateData: any = { trend };
      if (typeof trendRate === 'number') updateData.trend_rate = trendRate;

      const asset = await sbSingle<any>(`assets?id=eq.${assetId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
      if (!asset) return res.status(404).json({ error: 'Asset not found' });
      return res.json(asset);
    }

    if (action === 'update-payment-settings' && req.method === 'POST') {
      const settings = req.body;
      const existing = await sbSingle<any>(`payment_settings?select=id&limit=1`);

      let result;
      if (existing) {
        const updated = await sbSingle<any>(`payment_settings?id=eq.${existing.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ ...settings, updated_at: new Date().toISOString() })
        });
        if (!updated) throw new Error('Failed to update payment settings');
        result = updated;
      } else {
        const inserted = await sbSingle<any>('payment_settings', {
          method: 'POST',
          body: JSON.stringify({ ...settings, updated_at: new Date().toISOString() })
        });
        if (!inserted) throw new Error('Failed to insert payment settings');
        result = inserted;
      }
      return res.json(result);
    }

    if (action === 'update-user-status' && req.method === 'POST') {
      const { userId, status, verified } = req.body;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });

      const updateData: any = {};
      if (status) updateData.status = status;
      if (typeof verified === 'boolean') updateData.verified = verified;

      const updated = await sbSingle<any>(`users?id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
      if (!updated) throw new Error('Failed to update user');
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