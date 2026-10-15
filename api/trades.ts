import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sb, sbSingle, authMiddleware, applyCors } from '../_lib/shared';

// POST /api/trades?action=place&asset={assetId}
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  const action = req.query.action as string;

  const user = await authMiddleware(req, res);
  if (!user) return;

  try {
    if (action === 'place' && req.method === 'POST') {
      const { type, lot } = req.body;
      const assetId = req.query.asset as string;
      if (!assetId || !type || !lot) return res.status(400).json({ error: 'Missing required fields' });
      if (lot <= 0 || lot > user.balance) return res.status(400).json({ error: 'Invalid position size' });

      const asset = await sbSingle<any>(`assets?select=*&id=eq.${assetId}`);
      if (!asset) return res.status(404).json({ error: 'Asset not found' });

      const payoutRate = 0.88;
      const profit = lot * payoutRate;
      const isWin = Math.random() > 0.48;
      const finalProfit = isWin ? profit : -lot;

      const tradeData = {
        user_id: user.id, symbol: asset.symbol, type, lot,
        open_price: asset.price, close_price: asset.price * (isWin ? 1.0001 : 0.9999),
        profit: finalProfit, status: 'CLOSED',
        opened_at: new Date().toISOString(), closed_at: new Date().toISOString()
      };

      const trade = await sbSingle<any>('trades', { method: 'POST', body: JSON.stringify(tradeData) });
      if (!trade) throw new Error('Failed to create trade');

      const newBalance = Math.max(0, (user.balance || 0) + finalProfit);
      await sb(`users?id=eq.${user.id}`, { method: 'PATCH', body: JSON.stringify({ balance: newBalance }) });

      return res.json({ trade, newBalance, isWin, profit: finalProfit });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[TRADES ERROR]', action, err);
    return res.status(500).json({ error: err?.message || 'Trade failed' });
  }
}