import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, authMiddleware, applyCors } from '../_lib/shared';

// GET  /api/user?action=me
// POST /api/user?action=claim-bonus | ?action=update-profile
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  const action = req.query.action as string;

  const user = await authMiddleware(req, res);
  if (!user) return;

  try {
    if (action === 'me' && req.method === 'GET') {
      const { data: trades } = await supabaseAdmin.from('trades').select('*').eq('user_id', user.id).order('opened_at', { ascending: false });
      const { data: cards } = await supabaseAdmin.from('user_cards').select('*').eq('user_id', user.id);
      const { data: portfolio } = await supabaseAdmin.from('portfolio').select('*').eq('user_id', user.id);

      const openTrades = trades?.filter(t => t.status === 'OPEN') || [];
      const openProfit = openTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
      const equity = (user.balance || 0) + openProfit;

      const { password_hash, ...safeUser } = user;
      return res.json({
        ...safeUser, equity, margin: user.margin || 0,
        free_margin: user.free_margin || equity,
        margin_level: equity > 0 ? (equity / (user.margin || 1)) * 100 : 0,
        cards: cards || [], portfolio: portfolio || [], trades: trades || []
      });
    }

    if (action === 'claim-bonus' && req.method === 'POST') {
      if (user.bonus_claimed) return res.status(400).json({ error: 'Bonus already claimed' });

      const { data: settings } = await supabaseAdmin.from('payment_settings').select('bonus_amount').limit(1).single();
      const bonusAmount = settings?.bonus_amount || 10000;
      const newBalance = (user.balance || 0) + bonusAmount;

      const { data: updated, error } = await supabaseAdmin.from('users')
        .update({ balance: newBalance, bonus_claimed: true }).eq('id', user.id).select().single();
      if (error) throw error;

      const { password_hash, ...safeUser } = updated;
      return res.json({ success: true, balance: newBalance, user: safeUser });
    }

    if (action === 'update-profile' && req.method === 'POST') {
      const { name, phone, country } = req.body;
      const updateData: any = {};
      if (name) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (country !== undefined) updateData.country = country;

      const { data: updated, error } = await supabaseAdmin.from('users')
        .update(updateData).eq('id', user.id).select().single();
      if (error) throw error;

      const { password_hash, ...safeUser } = updated;
      return res.json(safeUser);
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[USER ERROR]', action, err);
    return res.status(500).json({ error: err?.message || 'Request failed' });
  }
}
