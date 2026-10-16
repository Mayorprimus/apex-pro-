import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sb, sbSingle, authMiddleware, applyCors } from '../_lib/shared';

// GET  /api/user?action=me
// POST /api/user?action=claim-bonus | ?action=update-profile
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  const action = req.query.action as string;

  const user = await authMiddleware(req, res);
  if (!user) return;

  try {
    if (action === 'me' && req.method === 'GET') {
      const [trades, userCards, userPortfolio] = await Promise.all([
        sb<any[]>(`trades?select=*&user_id=eq.${user.id}&order=opened_at.desc`),
        sb<any[]>(`user_cards?select=*&user_id=eq.${user.id}`),
        sb<any[]>(`portfolio?select=*&user_id=eq.${user.id}`)
      ]);

      const openTrades = trades?.filter(t => t.status === 'OPEN') || [];
      const openProfit = openTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
      const equity = (user.balance || 0) + openProfit;

      const { password_hash, ...safeUser } = user;
      return res.json({
        ...safeUser, equity, margin: user.margin || 0,
        free_margin: user.free_margin || equity,
        margin_level: equity > 0 ? (equity / (user.margin || 1)) * 100 : 0,
        cards: userCards || [], portfolio: userPortfolio || [], trades: trades || []
      });
    }

    if (action === 'claim-bonus' && req.method === 'POST') {
      if (user.bonus_claimed) return res.status(400).json({ error: 'Bonus already claimed' });

      const settings = await sbSingle<any>(`payment_settings?select=bonus_amount&limit=1`);
      const bonusAmount = settings?.bonus_amount || 10000;
      const newBalance = (user.balance || 0) + bonusAmount;

      const updated = await sbSingle<any>(`users?select=*&id=eq.${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ balance: newBalance, bonus_claimed: true })
      });
      if (!updated) throw new Error('Failed to update user');

      const { password_hash, ...safeUser } = updated;
      return res.json({ success: true, balance: newBalance, user: safeUser });
    }

    if (action === 'update-profile' && req.method === 'POST') {
      const { name, phone, country } = req.body;
      const updateData: any = {};
      if (name) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (country !== undefined) updateData.country = country;

      const updated = await sbSingle<any>(`users?id=eq.${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
      if (!updated) throw new Error('Failed to update profile');

      const { password_hash, ...safeUser } = updated;
      return res.json(safeUser);
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[USER ERROR]', action, err);
    return res.status(500).json({ error: err?.message || 'Request failed' });
  }
}