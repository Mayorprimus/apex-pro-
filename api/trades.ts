import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = 'https://smnvuvyybhliwrtgqdgx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbnZ1dnl5YmhsaXdydGdxZGd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjAxMTIxOCwiZXhwIjoyMTA3NTg3MjE4fQ.uycLaxtbgvhX5LBiz94C7kDjrRPAJSH-sYXvUdDYu5E';
const SUPABASE_HEADERS = {
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};
const crypto = require('crypto');

async function sb<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...SUPABASE_HEADERS, ...(options.headers || {}) }
  });
  if (!res.ok) { const text = await res.text(); throw new Error(`Supabase ${res.status}: ${text}`); }
  return res.json();
}

async function sbSingle<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  const arr = await sb<T[]>(`${path}&limit=1`, options);
  return arr[0] ?? null;
}

async function getUserFromSession(sessionId: string) {
  if (!sessionId) return null;
  const session = await sbSingle<any>(`sessions?select=user_id,expires_at&id=eq.${sessionId}`);
  if (!session || new Date(session.expires_at) < new Date()) { if (session) await sb(`sessions?id=eq.${sessionId}`, { method: 'DELETE' }); return null; }
  return sbSingle<any>(`users?select=*&id=eq.${session.user_id}`);
}

function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Session-ID');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  const action = req.query.action as string;

  const sessionId = req.headers['x-session-id'] as string;
  let user = null;
  if (sessionId) {
    const session = await sbSingle<any>(`sessions?select=user_id,expires_at&id=eq.${sessionId}`);
    if (!session || new Date(session.expires_at) < new Date()) { if (session) await sb(`sessions?id=eq.${sessionId}`, { method: 'DELETE' }); return res.status(401).json({ error: 'Unauthorized' }); }
    user = await sbSingle<any>(`users?select=*&id=eq.${session.user_id}`);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
  } else {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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